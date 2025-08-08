const { PrismaClient } = require('@prisma/client')

async function checkBusiness() {
  const prisma = new PrismaClient()
  try {
    const business = await prisma.businessSettings.findFirst({
      where: {
        isDefault: true,
        isActive: true
      }
    })
    
    console.log('Business Settings:', JSON.stringify(business, null, 2))
    
    if (business?.logo) {
      console.log('\n🔍 Logo field exists:', business.logo)
    } else {
      console.log('\n❌ No logo field in business settings')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkBusiness()
