// src/products/entities/product.entity.ts
export const ProductSchema = {
  name: 'product',
  columns: {
    id: { primary: true, type: 'int', generated: true },
    name: { type: 'varchar', length: 255 },
    description: { type: 'text', nullable: true },
    market_price: { type: 'decimal', precision: 10, scale: 2 },  // Precio de venta sugerido
    image_url: { type: 'text', nullable: true },
    is_active: { type: 'boolean', default: true },
    created_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' },
    updated_at: { type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' },
  },
};