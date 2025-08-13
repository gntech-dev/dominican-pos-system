const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProducts() {
  try {
    console.log('Testing products database...');
    
    // Check if there are products
    const count = await prisma.product.count();
    console.log('Total products:', count);
    
    if (count === 0) {
      console.log('Creating sample product...');
      
      // Create a sample product
      const product = await prisma.product.create({
        data: {
          code: 'SAMPLE001',
          name: 'Producto de Muestra',
          description: 'Este es un producto de muestra para probar el sistema',
          price: 250.00,
          cost: 150.00,
          stock: 25,
          minStock: 5,
          taxable: true,
          isActive: true
        }
      });
      
      console.log('Sample product created:', {
        id: product.id,
        code: product.code,
        name: product.name,
        price: product.price,
        stock: product.stock
      });
    } else {
      // Show existing products
      const products = await prisma.product.findMany({
        take: 3,
        include: { category: true }
      });
      
      console.log('Existing products:');
      products.forEach(p => {
        console.log(`- ${p.code}: ${p.name} (${p.stock} units, RD$ ${p.price})`);
      });
    }
    
  } catch (error) {
    console.error('Error testing products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProducts();
