# data-service/main.py → MARGEN Y GANANCIAS UNITARIAS REALES
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from sklearn.linear_model import LinearRegression
import numpy as np

app = FastAPI(title="Análisis de Negocio - Margen Real")

class AnalyticsRequest(BaseModel):
    business_db: str

@app.post("/analytics")
async def getAnalytics(request: AnalyticsRequest):
    try:
        engine = create_engine(f"postgresql://admin:password@localhost:5432/{request.business_db}")
        
        # === CARGAR DATOS ===
        sales_df = pd.read_sql_query("SELECT product_id, quantity, exit_price FROM sale", engine)
        products_df = pd.read_sql_query("SELECT id, name, market_price FROM product", engine)
        lots_df = pd.read_sql_query("SELECT product_id, entry_price, quantity, remaining FROM lot", engine)
        
        if sales_df.empty:
            return {"message": "Aún no tienes ventas registradas"}
        
        # === STOCK ACTUAL ===
        stock_actual = lots_df.groupby('product_id')['remaining'].sum().fillna(0).astype(int).reset_index()
        stock_actual.columns = ['product_id', 'stock']
        
        # === COSTO PROMEDIO PONDERADO POR PRODUCTO ===
        lots_df['sold_qty'] = lots_df['quantity'] - lots_df['remaining']
        lots_with_sales = lots_df[lots_df['sold_qty'] > 0].copy()
        
        cost_avg = pd.Series(dtype='float64')
        if not lots_with_sales.empty:
            cost_avg = lots_with_sales.groupby('product_id').apply(
                lambda x: round(np.average(x['entry_price'], weights=x['sold_qty']), 2),
                include_groups=False
            )
        
        # === COSTO PROMEDIO ACTUAL (para ganancia potencial) ===
        cost_avg_actual = lots_df.groupby('product_id').apply(
            lambda x: round(np.average(x['entry_price'], weights=x['quantity']), 2),
            include_groups=False
        )
        
        # === GANANCIA REAL POR VENTA ===
        ventas_expandidas = []
        total_ingresos = 0.0
        total_costo = 0.0
        
        for _, venta in sales_df.iterrows():
            costo_unitario = float(cost_avg.get(venta['product_id'], 0))
            ganancia_unitaria = venta['exit_price'] - costo_unitario
            ganancia_total_venta = ganancia_unitaria * venta['quantity']
            
            total_ingresos += float(venta['exit_price']) * venta['quantity']
            total_costo += costo_unitario * venta['quantity']
            
            ventas_expandidas.append({
                'product_id': venta['product_id'],
                'quantity': int(venta['quantity']),
                'exit_price': float(venta['exit_price']),
                'costo_promedio': costo_unitario,
                'ganancia_unitaria': ganancia_unitaria,
                'ganancia_total': ganancia_total_venta
            })
        
        ventas_df = pd.DataFrame(ventas_expandidas)
        
        # === RESUMEN ===
        total_unidades = int(ventas_df['quantity'].sum())
        ganancia_total = round(ventas_df['ganancia_total'].sum(), 2)
        margen_promedio = round((ganancia_total / total_ingresos * 100), 2) if total_ingresos > 0 else 0
        
        # === TOP 5 POR GANANCIA (CON MÉTRICAS REALES) ===
        top_por_producto = ventas_df.groupby('product_id').agg({
            'ganancia_total': 'sum',
            'quantity': 'sum',
            'ganancia_unitaria': 'mean',  # Promedio ponderado real de ganancias
            'exit_price': 'mean'
        }).reset_index()
        
        top_con_nombre = top_por_producto.merge(products_df, left_on='product_id', right_on='id', how='left')
        top_5 = top_con_nombre.nlargest(5, 'ganancia_total')
        
        top_productos = {}
        for _, row in top_5.iterrows():
            nombre = row['name'] or f"Producto {row['product_id']}"
            ventas_del_producto = int(row['quantity'])
            
            # GANANCIA UNITARIA REAL PROMEDIO (lo que realmente se ganó)
            ganancia_unitaria_real = round(float(row['ganancia_unitaria']), 2)
            
            # GANANCIA UNITARIA POTENCIAL (market_price - costo promedio actual)
            costo_actual = float(cost_avg_actual.get(row['product_id'], 0))
            market_price = float(row['market_price']) if pd.notna(row['market_price']) else 0
            ganancia_potencial = round(market_price - costo_actual, 2) if market_price > 0 else 0
            
            top_productos[nombre] = {
                "ventas": ventas_del_producto,
                "ganancia": round(float(row['ganancia_total']), 2),
                "ganancia_unitaria_real": ganancia_unitaria_real,  # Lo que se ganó en promedio
                "ganancia_unitaria_potencial": ganancia_potencial,  # Lo que se ganaría al precio de mercado
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
                "ganancia_total": ganancia_total,
                "margen_promedio": margen_promedio,
                "prediccion": prediccion
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