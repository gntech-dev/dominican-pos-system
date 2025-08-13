#!/usr/bin/env node
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseContent() {
  try {
    console.log('🔍 Checking database content...\n');
    
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    const categories = await prisma.category.count();
    const customers = await prisma.customer.count();
    const sales = await prisma.sale.count();
    const purchaseOrders = await prisma.purchaseOrder.count();
    const purchaseOrderItems = await prisma.purchaseOrderItem.count();
    
    console.log('📊 Database Summary:');
    console.log(`   👥 Users: ${users}`);
    console.log(`   📦 Products: ${products}`);
    console.log(`   📂 Categories: ${categories}`);
    console.log(`   👤 Customers: ${customers}`);
    console.log(`   💰 Sales: ${sales}`);
    console.log(`   📋 Purchase Orders: ${purchaseOrders}`);
    console.log(`   📋 Purchase Order Items: ${purchaseOrderItems}\n`);
    
    if (users > 0) {
      const userList = await prisma.user.findMany({
        select: { id: true, email: true, role: true, firstName: true, lastName: true }
      });
      console.log('👥 Existing Users:');
      userList.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - ${user.firstName} ${user.lastName}`);
      });
      console.log('');
    }
    
    if (purchaseOrderItems > 0) {
      console.log('⚠️  Purchase Order Items exist. This might prevent product deletion.');
      const items = await prisma.purchaseOrderItem.findMany({
        take: 5,
        include: { product: { select: { name: true } } }
      });
      console.log('First 5 items:');
      items.forEach(item => {
        console.log(`   - Product: ${item.product?.name || 'Unknown'}, Quantity: ${item.quantity}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseContent();
