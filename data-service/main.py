# data-service/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy import create_engine
import pandas as pd
import matplotlib.pyplot as plt
from io import BytesIO
import base64
from sklearn.linear_model import LinearRegression
import numpy as np
from typing import Any

app = FastAPI(title="Data Science Service - Gerentes")

# Convertir tipos de NumPy a Python nativos
def convert_numpy(obj: Any):
    if isinstance(obj, np.integer):
        return int(obj)
    if isinstance(obj, np.floating):
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, pd.Timestamp):
        return obj.isoformat()
    return obj

class AnalyticsRequest(BaseModel):
    business_db: str

@app.post("/analytics")
async def getAnalytics(request: AnalyticsRequest):
    try:
        engine = create_engine(f"postgresql://admin:password@localhost:5432/{request.business_db}")
        
        # Leer ventas y productos
        sales_df = pd.read_sql_query("SELECT * FROM sale", engine)
        products_df = pd.read_sql_query("SELECT id, name, stock, price FROM product", engine)

        if sales_df.empty:
            return {"message": "No hay ventas registradas aún"}

        # === TOTAL VENTAS ===
        total_ventas = int(sales_df['quantity'].sum())

        # === TOP 5 PRODUCTOS (con NOMBRE REAL) ===
        ventas_por_producto = sales_df.groupby('product_id')['quantity'].sum().reset_index()
        ventas_con_nombre = ventas_por_producto.merge(
            products_df[['id', 'name']], 
            left_on='product_id', 
            right_on='id', 
            how='left'
        )
        top_5 = ventas_con_nombre.sort_values('quantity', ascending=False).head(5)
        
        # Formato final: { "Camisa Azul": 45 }
        top_productos = {
            row['name'] if pd.notna(row['name']) else f"Producto {row['product_id']}": int(row['quantity'])
            for _, row in top_5.iterrows()
        }

        # === STOCK BAJO (con nombre) ===
        stock_bajo_df = products_df[products_df['stock'] < 10][['id', 'name', 'stock']].copy()
        stock_bajo = [
            {
                "id": int(row['id']),
                "name": row['name'] if pd.notna(row['name']) else f"Producto {row['id']}",
                "stock": int(row['stock'])
            }
            for _, row in stock_bajo_df.iterrows()
        ]

        # === PREDICCIÓN ===
        sales_df['date'] = pd.to_datetime(sales_df['created_at']).dt.date
        daily_sales = sales_df.groupby('date')['quantity'].sum().reset_index()
        
        if len(daily_sales) >= 2:
            X = np.arange(len(daily_sales)).reshape(-1, 1)
            y = daily_sales['quantity'].values
            model = LinearRegression().fit(X, y)
            next_day = model.predict([[len(daily_sales)]])[0]
            prediccion = f"Pronóstico para mañana: {int(round(next_day))} unidades"
        else:
            prediccion = "Datos insuficientes (mínimo 2 días)"

        # === GRÁFICOS (con nombres reales) ===
        plt.figure(figsize=(11, 6))
        plt.plot(daily_sales['date'], daily_sales['quantity'], 'o-', color='#007bff', linewidth=3, markersize=8)
        plt.title('Tendencia de Ventas Diarias', fontsize=18, fontweight='bold', pad=20)
        plt.xlabel('Fecha', fontsize=14)
        plt.ylabel('Unidades Vendidas', fontsize=14)
        plt.grid(True, alpha=0.3)
        plt.xticks(rotation=45)
        buf1 = BytesIO()
        plt.tight_layout()
        plt.savefig(buf1, format='png', dpi=150)
        plt.close()
        ventas_grafico = base64.b64encode(buf1.getvalue()).decode()

        plt.figure(figsize=(10, 7))
        nombres = list(top_productos.keys())
        cantidades = list(top_productos.values())
        colors = ['#28a745', '#007bff', '#6f42c1', '#dc3545', '#fd7e14']
        plt.bar(nombres, cantidades, color=colors[:len(nombres)])
        plt.title('Top 5 Productos Más Vendidos', fontsize=18, fontweight='bold', pad=20)
        plt.ylabel('Unidades Vendidas', fontsize=14)
        plt.xticks(rotation=45, ha='right')
        buf2 = BytesIO()
        plt.tight_layout()
        plt.savefig(buf2, format='png', dpi=150)
        plt.close()
        top_grafico = base64.b64encode(buf2.getvalue()).decode()

        return {
            "total_ventas": total_ventas,
            "top_productos": top_productos,  # ← Ahora con nombres reales
            "stock_bajo": stock_bajo,        # ← También con nombres
            "prediccion": prediccion,
            "graficos": {
                "ventas_diarias": ventas_grafico,
                "top_productos": top_grafico
            }
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")