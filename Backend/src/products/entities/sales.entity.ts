// src/products/entities/sale.entity.ts  (dentro de cada base de negocio)
export const SaleSchema = {
  name: 'sale',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    product_id: { type: 'int' },
    quantity: { type: 'int' },
    type: { type: 'varchar', length: 20 }, // 'sale' o 'exchange'
    notes: { type: 'text', nullable: true },
    created_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
  },
  relations: {
    product: { target: 'product', type: 'many-to-one', joinColumn: true },
  },
};