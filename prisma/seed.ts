import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data (in proper order to avoid foreign key constraints)
  console.log('🗑️  Clearing existing data...')
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.ncfSequence.deleteMany()
  await prisma.rncRegistry.deleteMany()
  await prisma.product.deleteMany()
  await prisma.category.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.auditLog.deleteMany()
  await prisma.user.deleteMany()
  await prisma.systemConfig.deleteMany()
  await prisma.businessSettings.deleteMany()

  // Create Users with hashed passwords
  console.log('👥 Creating users...')
  const hashedAdminPassword = await bcrypt.hash('admin123', 10)
  const hashedManagerPassword = await bcrypt.hash('manager123', 10)
  const hashedCashierPassword = await bcrypt.hash('cashier123', 10)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@pos.do',
      username: 'admin',
      password: hashedAdminPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: 'ADMIN',
      isActive: true,
    },
  })

  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@pos.do',
      username: 'manager',
      password: hashedManagerPassword,
      firstName: 'Gerente',
      lastName: 'General',
      role: 'MANAGER',
      isActive: true,
    },
  })

  const cashierUser = await prisma.user.create({
    data: {
      email: 'cashier@pos.do',
      username: 'cashier',
      password: hashedCashierPassword,
      firstName: 'Cajero',
      lastName: 'Principal',
      role: 'CASHIER',
      isActive: true,
    },
  })

  console.log(`✅ Created ${3} users`)

  // Create Categories
  console.log('📂 Creating categories...')
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: 'Bebidas',
        description: 'Refrescos, jugos y bebidas alcohólicas',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Alimentos',
        description: 'Comida empacada, snacks y productos alimenticios',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Limpieza',
        description: 'Productos de limpieza y higiene personal',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Tecnología',
        description: 'Dispositivos electrónicos y accesorios',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Farmacia',
        description: 'Medicamentos y productos de salud',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Cosméticos',
        description: 'Productos de belleza y cuidado personal',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Hogar',
        description: 'Artículos para el hogar y decoración',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        name: 'Deportes',
        description: 'Equipos y accesorios deportivos',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${categories.length} categories`)

  // Create Products
  console.log('🛍️  Creating products...')
  const products = await Promise.all([
    // Bebidas
    prisma.product.create({
      data: {
        name: 'Coca Cola 2L',
        description: 'Refresco de cola 2 litros',
        price: 89.00,
        cost: 65.00,
        code: '7401005988967',
        stock: 120,
        minStock: 20,
        categoryId: categories[0].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Agua Planeta Azul 1L',
        description: 'Agua purificada 1 litro',
        price: 35.00,
        cost: 22.00,
        code: '7401005988968',
        stock: 200,
        minStock: 50,
        categoryId: categories[0].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Cerveza Presidente 355ml',
        description: 'Cerveza nacional lata 355ml',
        price: 95.00,
        cost: 70.00,
        code: '7401005988969',
        stock: 80,
        minStock: 15,
        categoryId: categories[0].id,
        isActive: true,
      },
    }),
    
    // Alimentos  
    prisma.product.create({
      data: {
        name: 'Arroz Blanquita 5lb',
        description: 'Arroz blanco 5 libras',
        price: 165.00,
        cost: 125.00,
        code: '7401005988970',
        stock: 150,
        minStock: 25,
        categoryId: categories[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Aceite Mazola 1L',
        description: 'Aceite de maíz 1 litro',
        price: 285.00,
        cost: 220.00,
        code: '7401005988971',
        stock: 90,
        minStock: 15,
        categoryId: categories[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Pan Tostado Bimbo',
        description: 'Pan de molde tostado 680g',
        price: 125.00,
        cost: 95.00,
        code: '7401005988972',
        stock: 45,
        minStock: 10,
        categoryId: categories[1].id,
        isActive: true,
      },
    }),

    // Limpieza
    prisma.product.create({
      data: {
        name: 'Detergente Tide 1kg',
        description: 'Detergente en polvo 1 kilogramo',
        price: 245.00,
        cost: 185.00,
        code: '7401005988973',
        stock: 75,
        minStock: 12,
        categoryId: categories[2].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Jabón Palmolive',
        description: 'Jabón de tocador 90g',
        price: 65.00,
        cost: 45.00,
        code: '7401005988974',
        stock: 120,
        minStock: 30,
        categoryId: categories[2].id,
        isActive: true,
      },
    }),

    // Tecnología
    prisma.product.create({
      data: {
        name: 'Cable USB-C 1m',
        description: 'Cable USB-C carga rápida 1 metro',
        price: 450.00,
        cost: 320.00,
        code: '7401005988975',
        stock: 25,
        minStock: 5,
        categoryId: categories[3].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Auriculares Bluetooth',
        description: 'Auriculares inalámbricos con micrófono',
        price: 1250.00,
        cost: 875.00,
        code: '7401005988976',
        stock: 15,
        minStock: 3,
        categoryId: categories[3].id,
        isActive: true,
      },
    }),

    // Farmacia
    prisma.product.create({
      data: {
        name: 'Paracetamol 500mg',
        description: 'Tabletas para dolor y fiebre (10 unidades)',
        price: 85.00,
        cost: 55.00,
        code: '7401005988977',
        stock: 200,
        minStock: 50,
        categoryId: categories[4].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Alcohol 70% 250ml',
        description: 'Alcohol isopropílico desinfectante',
        price: 125.00,
        cost: 85.00,
        code: '7401005988978',
        stock: 80,
        minStock: 15,
        categoryId: categories[4].id,
        isActive: true,
      },
    }),

    // Cosméticos
    prisma.product.create({
      data: {
        name: 'Champú Pantene 400ml',
        description: 'Champú reparación total 400ml',
        price: 285.00,
        cost: 205.00,
        code: '7401005988979',
        stock: 60,
        minStock: 12,
        categoryId: categories[5].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Crema Nivea 200ml',
        description: 'Crema hidratante corporal 200ml',
        price: 195.00,
        cost: 145.00,
        code: '7401005988980',
        stock: 45,
        minStock: 8,
        categoryId: categories[5].id,
        isActive: true,
      },
    }),

    // Hogar
    prisma.product.create({
      data: {
        name: 'Toalla de Baño',
        description: 'Toalla 100% algodón 70x140cm',
        price: 650.00,
        cost: 475.00,
        code: '7401005988981',
        stock: 30,
        minStock: 5,
        categoryId: categories[6].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Bombillo LED 12W',
        description: 'Bombillo LED luz blanca 12 watts',
        price: 285.00,
        cost: 195.00,
        code: '7401005988982',
        stock: 40,
        minStock: 8,
        categoryId: categories[6].id,
        isActive: true,
      },
    }),

    // Deportes
    prisma.product.create({
      data: {
        name: 'Pelota de Volleyball',
        description: 'Pelota oficial de volleyball',
        price: 1850.00,
        cost: 1325.00,
        code: '7401005988983',
        stock: 8,
        minStock: 2,
        categoryId: categories[7].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Botella Deportiva 1L',
        description: 'Botella de agua deportiva 1 litro',
        price: 385.00,
        cost: 275.00,
        code: '7401005988984',
        stock: 25,
        minStock: 5,
        categoryId: categories[7].id,
        isActive: true,
      },
    }),

    // Productos adicionales
    prisma.product.create({
      data: {
        name: 'Café Santo Domingo 454g',
        description: 'Café molido tradicional 454 gramos',
        price: 325.00,
        cost: 245.00,
        code: '7401005988985',
        stock: 65,
        minStock: 12,
        categoryId: categories[1].id,
        isActive: true,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Papel Higiénico Scott 4 rollos',
        description: 'Papel higiénico doble hoja 4 rollos',
        price: 185.00,
        cost: 135.00,
        code: '7401005988986',
        stock: 85,
        minStock: 18,
        categoryId: categories[2].id,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${products.length} products`)

  // Create Customers
  console.log('👨‍👩‍👧‍👦 Creating customers...')
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'María González',
        email: 'maria.gonzalez@email.com',
        phone: '809-555-0101',
        address: 'Calle Principal #123, Santo Domingo',
        customerType: 'INDIVIDUAL',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Supermercado La Familia',
        email: 'compras@lafamilia.com.do',
        phone: '809-555-0102', 
        address: 'Av. 27 de Febrero #456, Santo Domingo',
        rnc: '130123456789',
        customerType: 'BUSINESS',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Carlos Martínez',
        email: 'carlos.martinez@email.com',
        phone: '829-555-0103',
        address: 'Zona Colonial, Santo Domingo',
        customerType: 'INDIVIDUAL',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Restaurante El Buen Sabor SRL',
        email: 'administracion@elbuensabor.do',
        phone: '809-555-0104',
        address: 'Piantini, Santo Domingo',
        rnc: '130987654321',
        customerType: 'BUSINESS',
        isActive: true,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Ana Rodríguez',
        email: 'ana.rodriguez@email.com',
        phone: '849-555-0105',
        address: 'Los Alcarrizos, Santo Domingo Oeste',
        customerType: 'INDIVIDUAL',
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${customers.length} customers`)

  // Create NCF Sequences for Dominican Republic fiscal compliance
  console.log('🧾 Creating NCF sequences...')
  const ncfSequences = await Promise.all([
    prisma.ncfSequence.create({
      data: {
        type: 'B01', // Facturas de Crédito Fiscal
        currentNumber: 1,
        maxNumber: 50000000,
        isActive: true,
      },
    }),
    prisma.ncfSequence.create({
      data: {
        type: 'B02', // Facturas de Consumo
        currentNumber: 1,
        maxNumber: 50000000,
        isActive: true,
      },
    }),
    prisma.ncfSequence.create({
      data: {
        type: 'B04', // Nota de Crédito
        currentNumber: 1,
        maxNumber: 50000000,
        isActive: true,
      },
    }),
    prisma.ncfSequence.create({
      data: {
        type: 'B03', // Nota de Débito  
        currentNumber: 1,
        maxNumber: 50000000,
        isActive: true,
      },
    }),
  ])

  console.log(`✅ Created ${ncfSequences.length} NCF sequences`)

  // Create RNC Registry entries (sample from DGII)
  console.log('🏢 Creating RNC registry...')
  const rncEntries = await Promise.all([
    prisma.rncRegistry.create({
      data: {
        rnc: '130123456789',
        name: 'SUPERMERCADO LA FAMILIA SRL',
        status: 'ACTIVE',
        category: 'Venta al por menor',
      },
    }),
    prisma.rncRegistry.create({
      data: {
        rnc: '130987654321',
        name: 'RESTAURANTE EL BUEN SABOR SRL',
        status: 'ACTIVE',
        category: 'Servicios de restaurante',
      },
    }),
    prisma.rncRegistry.create({
      data: {
        rnc: '101234567890',
        name: 'DISTRIBUIDORA NACIONAL SA',
        status: 'ACTIVE',
        category: 'Distribución al por mayor',
      },
    }),
  ])

  console.log(`✅ Created ${rncEntries.length} RNC registry entries`)

  // Create System Configuration
  console.log('⚙️  Creating system configuration...')
  await prisma.systemConfig.create({
    data: {
      key: 'ITBIS_RATE',
      value: '0.18',
      description: 'ITBIS tax rate (18%)',
    },
  })

  await prisma.systemConfig.create({
    data: {
      key: 'BUSINESS_NAME',
      value: 'Mi Negocio Dominicano',
      description: 'Business name for receipts',
    },
  })

  await prisma.systemConfig.create({
    data: {
      key: 'BUSINESS_RNC',
      value: '130000000001',
      description: 'Business RNC number',
    },
  })

  await prisma.systemConfig.create({
    data: {
      key: 'BUSINESS_ADDRESS',
      value: 'Calle Comercial #100, Santo Domingo, República Dominicana',
      description: 'Business address for receipts',
    },
  })

  console.log('✅ Created system configuration')

  // Create Business Settings
  console.log('🏢 Creating business settings...')
  const businessSettings = await prisma.businessSettings.create({
    data: {
      name: 'POS Dominicana',
      rnc: '130123456789',
      address: 'Calle Principal #123',
      phone: '(809) 555-0123',
      email: 'info@posdominicana.com',
      website: 'www.posdominicana.com',
      slogan: 'Tu punto de venta confiable',
      city: 'Santo Domingo',
      province: 'Distrito Nacional',
      country: 'República Dominicana',
      postalCode: '10101',
      taxRegime: 'Régimen Ordinario',
      economicActivity: 'Venta al por menor de productos varios',
      receiptFooter: 'Gracias por su compra. ¡Esperamos verle pronto!',
      invoiceTerms: 'Pago a 30 días. Intereses por mora del 2% mensual.',
      warrantyInfo: 'Garantía de 30 días en productos electrónicos.',
      isActive: true,
      isDefault: true
    }
  })

  console.log('✅ Created business settings')

  console.log('🎉 Database seeding completed successfully!')
  console.log('')
  console.log('📋 Summary:')
  console.log(`   👥 Users: ${3}`)
  console.log(`   📂 Categories: ${categories.length}`)
  console.log(`   🛍️  Products: ${products.length}`)
  console.log(`   👨‍👩‍👧‍👦 Customers: ${customers.length}`)
  console.log(`   🧾 NCF Sequences: ${ncfSequences.length}`)
  console.log(`   🏢 RNC Entries: ${rncEntries.length}`)
  console.log(`   ⚙️  Business Settings: 1`)
  console.log('')
  console.log('🔐 Test Users:')
  console.log('   Admin: admin@pos.do / admin123')
  console.log('   Manager: manager@pos.do / manager123')
  console.log('   Cashier: cashier@pos.do / cashier123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
