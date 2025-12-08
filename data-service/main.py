from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from sklearn.linear_model import LinearRegression
import numpy as np

app = FastAPI(title="Análisis de Negocio - FIFO Real")

class AnalyticsRequest(BaseModel):
    business_db: str

@app.post("/analytics")
async def getAnalytics(request: AnalyticsRequest):
    try:
        engine = create_engine(f"postgresql://admin:password@localhost:5432/{request.business_db}")
        
        # === CARGAR DATOS ===
        sales_df = pd.read_sql_query("SELECT id, product_id, quantity, exit_price, created_at FROM sale ORDER BY created_at", engine)
        products_df = pd.read_sql_query("SELECT id, name, market_price FROM product", engine)
        lots_df = pd.read_sql_query("SELECT id, product_id, entry_price, quantity, remaining, created_at FROM lot ORDER BY created_at", engine)
        
        if sales_df.empty:
            return {"message": "Aún no tienes ventas registradas"}
        
        # === STOCK ACTUAL ===
        stock_actual = lots_df.groupby('product_id')['remaining'].sum().fillna(0).astype(int).reset_index()
        stock_actual.columns = ['product_id', 'stock']
        
        # === CALCULAR INVERSIÓN TOTAL ===
        inversion_total = 0.0
        for _, lot in lots_df.iterrows():
            inversion_total += float(lot['entry_price']) * int(lot['quantity'])
        inversion_total = round(inversion_total, 2)
        
        # === SIMULAR FIFO PARA CALCULAR COSTO REAL DE LO VENDIDO ===
        # Crear una copia de los lotes para simular consumo
        lotes_estado = {}
        for _, lot in lots_df.iterrows():
            if lot['product_id'] not in lotes_estado:
                lotes_estado[lot['product_id']] = []
            lotes_estado[lot['product_id']].append({
                'lot_id': lot['id'],
                'entry_price': float(lot['entry_price']),
                'disponible': int(lot['quantity'])  # Empezamos con cantidad original
            })
        
        # Procesar ventas en orden cronológico
        ventas_expandidas = []
        total_ingresos_reales = 0.0
        inversion_recuperada = 0.0
        
        for _, venta in sales_df.iterrows():
            product_id = venta['product_id']
            cantidad_vender = int(venta['quantity'])
            exit_price = float(venta['exit_price'])
            
            # Ingresos de esta venta
            ingreso_venta = exit_price * cantidad_vender
            total_ingresos_reales += ingreso_venta
            
            # Consumir lotes FIFO para calcular costo
            costo_total_venta = 0.0
            cantidad_restante = cantidad_vender
            
            if product_id in lotes_estado:
                for lote in lotes_estado[product_id]:
                    if cantidad_restante <= 0:
                        break
                    
                    # Cuánto podemos tomar de este lote
                    tomar = min(cantidad_restante, lote['disponible'])
                    
                    if tomar > 0:
                        costo_total_venta += lote['entry_price'] * tomar
                        lote['disponible'] -= tomar
                        cantidad_restante -= tomar
            
            # Costo promedio de esta venta específica
            costo_promedio_venta = costo_total_venta / cantidad_vender if cantidad_vender > 0 else 0
            ganancia_unitaria = exit_price - costo_promedio_venta
            ganancia_total = ingreso_venta - costo_total_venta
            
            inversion_recuperada += costo_total_venta
            
            ventas_expandidas.append({
                'product_id': product_id,
                'quantity': cantidad_vender,
                'exit_price': exit_price,
                'costo_promedio': round(costo_promedio_venta, 2),
                'ganancia_unitaria': round(ganancia_unitaria, 2),
                'ganancia_total': round(ganancia_total, 2)
            })
        
        ventas_df = pd.DataFrame(ventas_expandidas)
        
        # Redondear totales
        total_ingresos_reales = round(total_ingresos_reales, 2)
        inversion_recuperada = round(inversion_recuperada, 2)
        
        # === INVERSIÓN ACTUAL (en stock) ===
        inversion_actual = round(inversion_total - inversion_recuperada, 2)
        
        # === GANANCIA REAL ===
        ganancia_real = round(total_ingresos_reales - inversion_recuperada, 2)
        margen_promedio = round((ganancia_real / total_ingresos_reales * 100), 2) if total_ingresos_reales > 0 else 0
        
        # === ROI (sobre inversión total) ===
        roi = round((ganancia_real / inversion_total * 100), 2) if inversion_total > 0 else 0
        
        print(f"DEBUG FIFO: ingresos={total_ingresos_reales}, inv_recuperada={inversion_recuperada}, ganancia={ganancia_real}, roi={roi}%")
        
        # === COSTO PROMEDIO ACTUAL (para stock restante) ===
        cost_avg_actual = {}
        for product_id in lots_df['product_id'].unique():
            product_lots = lots_df[lots_df['product_id'] == product_id]
            total_cost = sum(row['entry_price'] * row['remaining'] for _, row in product_lots.iterrows())
            total_qty = product_lots['remaining'].sum()
            cost_avg_actual[product_id] = round(total_cost / total_qty, 2) if total_qty > 0 else 0
        
        # === VALOR POTENCIAL ===
        valor_real_vendidos = total_ingresos_reales
        valor_market_actual = 0.0
        
        for _, producto in products_df.iterrows():
            if pd.notna(producto['market_price']):
                market_p = float(producto['market_price'])
                
                stock_producto = stock_actual[stock_actual['product_id'] == producto['id']]
                if not stock_producto.empty:
                    stock_qty = int(stock_producto['stock'].iloc[0])
                    valor_market_actual += market_p * stock_qty
        
        valor_market_actual = round(valor_market_actual, 2)
        valor_market_total = round(valor_real_vendidos + valor_market_actual, 2)
        
        # === RESUMEN ===
        total_unidades = int(ventas_df['quantity'].sum())
        
        # === TOP 5 ===
        top_por_producto = ventas_df.groupby('product_id').agg({
            'ganancia_total': 'sum',
            'quantity': 'sum',
            'ganancia_unitaria': 'mean',
            'exit_price': 'mean'
        }).reset_index()
        
        top_con_nombre = top_por_producto.merge(products_df, left_on='product_id', right_on='id', how='left')
        top_5 = top_con_nombre.nlargest(5, 'ganancia_total')
        
        top_productos = {}
        for _, row in top_5.iterrows():
            nombre = row['name'] or f"Producto {row['product_id']}"
            
            ganancia_unitaria_real = round(float(row['ganancia_unitaria']), 2)
            
            costo_actual = cost_avg_actual.get(row['product_id'], 0)
            market_price = float(row['market_price']) if pd.notna(row['market_price']) else 0
            ganancia_potencial = round(market_price - costo_actual, 2) if market_price > 0 else 0
            
            top_productos[nombre] = {
                "ventas": int(row['quantity']),
                "ganancia": round(float(row['ganancia_total']), 2),
                "ganancia_unitaria_real": ganancia_unitaria_real,
                "ganancia_unitaria_potencial": ganancia_potencial,
                "precio_promedio_venta": round(float(row['exit_price']), 2)
            }
        
        # === STOCK BAJO ===
        stock_bajo_list = []
        for _, row in stock_actual[stock_actual['stock'] < 3].iterrows():
            nombre = products_df[products_df['id'] == row['product_id']]['name'].iloc[0] if not products_df[products_df['id'] == row['product_id']].empty else "Sin nombre"
            stock_bajo_list.append({"name": nombre, "stock": int(row['stock'])})
        
        # === PREDICCIÓN ===
        sales_full = pd.read_sql_query("SELECT created_at, quantity FROM sale", engine)
        sales_full['date'] = pd.to_datetime(sales_full['created_at']).dt.date
        daily = sales_full.groupby('date')['quantity'].sum().reset_index()
        
        if len(daily) >= 2:
            X = np.arange(len(daily)).reshape(-1, 1)
            model = LinearRegression().fit(X, daily['quantity'])
            pred = model.predict([[len(daily)]])[0]
            prediccion = f"~{round(pred, 1)} unidades"
        else:
            prediccion = "Datos insuficientes"
        
        # === GRÁFICOS ===
        plt.figure(figsize=(11, 6))
        plt.plot(daily['date'], daily['quantity'], 'o-', color='#007bff', linewidth=3, markersize=8)
        plt.title('Ventas Diarias', fontsize=18, fontweight='bold')
        plt.ylabel('Unidades')
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        buf1 = BytesIO()
        plt.tight_layout()
        plt.savefig(buf1, format='png', dpi=150)
        plt.close()
        ventas_grafico = base64.b64encode(buf1.getvalue()).decode()
        
        plt.figure(figsize=(10, 7))
        nombres = [row['name'][:18] or f"ID {row['product_id']}" for _, row in top_5.iterrows()]
        ganancias = [round(float(g), 2) for g in top_5['ganancia_total']]
        plt.barh(nombres[::-1], ganancias[::-1], color='#28a745')
        plt.title('Top 5 Productos por Ganancia', fontsize=18, fontweight='bold')
        plt.xlabel('Ganancia ($)')
        for i, v in enumerate(ganancias[::-1]):
            plt.text(v + max(ganancias)*0.01, i, f"${v:,.2f}", va='center', fontweight='bold')
        buf2 = BytesIO()
        plt.tight_layout()
        plt.savefig(buf2, format='png', dpi=150)
        plt.close()
        ganancia_grafico = base64.b64encode(buf2.getvalue()).decode()
        
        return {
            "resumen": {
                "total_unidades_vendidas": total_unidades,
                "ganancia_real": ganancia_real,
                "margen_promedio": margen_promedio,
                "roi": roi,
                "prediccion": prediccion,
                "inversion_total": inversion_total,
                "inversion_recuperada": inversion_recuperada,
                "inversion_actual": inversion_actual,
                "total_ingresos_reales": total_ingresos_reales,
                "valor_market_total": valor_market_total,
                "valor_market_actual": valor_market_actual,
            },
            "top_ganancia": top_productos,
            "stock_bajo": stock_bajo_list,
            "graficos": {
                "ventas_diarias": ventas_grafico,
                "ganancia_productos": ganancia_grafico
            }
        }
    
    except Exception as e:
        print("ERROR:", str(e))
        raise HTTPException(status_code=500, detail=str(e))