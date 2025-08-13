/**
 * @file DGII XML Test Endpoint
 * @description Test endpoint to verify DGII XML generation functionality
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  generateDGII606XML, 
  generateDGII607XML,
  type DGII606Record,
  type DGII607Record,
  type CompanyInfo
} from '@/utils/dgii-xml-generator'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl
    const type = searchParams.get('type') || '607'

    // Test company info
    const companyInfo: CompanyInfo = {
      rnc: '130123456',
      razonSocial: 'Empresa de Prueba SRL',
      periodo: '202412'
    }

    if (type === '606') {
      // Test 606 (Purchase) data
      const testPurchases: DGII606Record[] = [
        {
          rnc: '101234567',
          tipoId: '1',
          numeroComprobante: 'A010000001',
          fechaComprobante: '2024-12-01',
          montoFacturado: 1000.00,
          itbisFacturado: 180.00
        },
        {
          rnc: '109876543',
          tipoId: '1', 
          numeroComprobante: 'A010000002',
          fechaComprobante: '2024-12-02',
          montoFacturado: 500.00,
          itbisFacturado: 90.00
        }
      ]

      const xml606 = generateDGII606XML(companyInfo, testPurchases)

      return new NextResponse(xml606, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="test_606_202412.xml"'
        }
      })
    } else {
      // Test 607 (Sales) data
      const testSales: DGII607Record[] = [
        {
          rnc: '201234567',
          tipoId: '1',
          numeroComprobante: 'B01000001',
          fechaComprobante: '2024-12-01',
          montoFacturado: 1500.00,
          itbisFacturado: 270.00
        },
        {
          rnc: '000000000',
          tipoId: '2',
          numeroComprobante: 'B02000001', 
          fechaComprobante: '2024-12-02',
          montoFacturado: 800.00,
          itbisFacturado: 144.00
        }
      ]

      const xml607 = generateDGII607XML(companyInfo, testSales)

      return new NextResponse(xml607, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': 'attachment; filename="test_607_202412.xml"'
        }
      })
    }

  } catch (error: any) {
    console.error('Error generating test DGII XML:', error)
    return NextResponse.json({
      error: 'Failed to generate test DGII XML',
      details: error.message
    }, { status: 500 })
  }
}
