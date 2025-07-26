# Copilot Instructions for POS System

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a comprehensive Point of Sale (POS) system built for Dominican Republic market with full DGII compliance. The system handles regular NCF (Número de Comprobante Fiscal) receipts and includes RNC validation.

## Technology Stack
- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with role-based access control

## Key Requirements

### DGII Compliance
- Regular NCF management (B01, B02, B03, B04 types)
- Sequential NCF numbering with strict control
- ITBIS tax calculations (18% standard rate)
- RNC validation using local database from DGII CSV
- Proper receipt formatting with all required fiscal fields
- Complete audit trails for all transactions

### System Features
- Role-based user management (Admin, Manager, Cashier)
- Customer management with RNC validation
- Inventory system with stock control
- Sales processing with thermal receipt printing
- Comprehensive reporting system
- Multi-language support (Spanish primary, English secondary)

### Code Standards
- Use TypeScript for all new code
- Follow React functional components with hooks
- Implement proper error handling and validation
- Use Prisma for database operations
- Include comprehensive JSDoc documentation
- Follow SOLID principles and clean architecture
- Use Next.js App Router for all routing

### Dominican Republic Specific
- All currency in DOP (Dominican Pesos)
- Date format: DD/MM/YYYY
- Tax calculations must be precise to 2 decimal places
- RNC format: 9 or 11 digits
- NCF format: 3 letters + 8 digits (e.g., B01########)

## Development Guidelines
- Always validate RNC numbers before processing business transactions
- Ensure NCF sequences are never broken or duplicated
- Include proper tax breakdown on all receipts
- Maintain complete transaction logs for audit purposes
- Handle offline scenarios gracefully
- Focus on performance for high-volume sales environments
- Use Server Actions for mutations and API routes for data fetching
- Implement proper TypeScript types for all Dominican Republic specific data
