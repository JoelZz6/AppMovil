export const LotSchema = {
  name: 'lot',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    product_id: { type: 'int' },
    entry_price: { type: 'decimal', precision: 10, scale: 2 },  // Costo de entrada
    quantity: { type: 'int' },  // Cantidad del lote
    remaining: { type: 'int' },  // Cantidad restante (inicia con quantity)
    created_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
  },
  relations: {
    product: { target: 'product', type: 'many-to-one', joinColumn: true },
  },
};