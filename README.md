# Sistema POS - República Dominicana

Un sistema completo de Punto de Venta diseñado específicamente para el mercado dominicano con cumplimiento total de las regulaciones de la DGII.

## 🚀 Características Principales

### Cumplimiento DGII
- ✅ Gestión de NCF (Número de Comprobante Fiscal) regulares
- ✅ Tipos de NCF: B01, B02, B03, B04, B11, B12, B13, B14, B15
- ✅ Numeración secuencial controlada
- ✅ Cálculos de ITBIS (18% tasa estándar)
- ✅ Validación de RNC usando base de datos DGII
- ✅ Sincronización diaria automática con base de datos DGII
- ✅ Búsqueda de clientes por RNC para facturas B01
- ✅ Formato de recibos con campos fiscales requeridos
- ✅ Auditoría completa de transacciones

### Funcionalidades del Sistema
- 👥 Gestión de usuarios con roles (Admin, Manager, Cajero)
- 🛒 Gestión de clientes con validación RNC integrada con DGII
- � Búsqueda de clientes ocasionales por RNC para facturas B01
- �📦 Sistema de inventario con control de stock
- 💰 Procesamiento de ventas con vista previa e impresión térmica
- 📊 Sistema de reportes comprensivo
- 🌐 Soporte multi-idioma (Español primario, Inglés secundario)
- 🔄 Sincronización automática con base de datos RNC de DGII

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Estilo**: Tailwind CSS
- **Backend**: Next.js API Routes + TypeScript
- **Base de Datos**: PostgreSQL con Prisma ORM
- **Autenticación**: JWT con control de acceso basado en roles

## 📋 Prerrequisitos

- Node.js 18.0 o superior
- PostgreSQL 12 o superior
- npm o yarn

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd pos
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Copiar `.env.example` a `.env` y configurar:
```bash
# Base de datos
DATABASE_URL="postgresql://postgres:password@localhost:5432/pos_dominicana?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# JWT
JWT_SECRET="your-jwt-secret-here"
```

### 4. Configurar base de datos
```bash
# Crear y ejecutar migraciones
npm run db:migrate

# Generar cliente Prisma
npm run db:generate

# Sembrar datos iniciales
npm run db:seed
```

### 5. Ejecutar en modo desarrollo
```bash
# Ejecutar con soporte IPv4 e IPv6
npm run dev

# Solo IPv4
npm run dev:ipv4

# Solo IPv6
npm run dev:ipv6
```

El sistema estará disponible en:
- **IPv4**: `http://localhost:3000`
- **IPv6**: `http://[::1]:3000`
- **Red local**: `http://[::]:3000`

## 📊 Características Específicas para República Dominicana

### Validaciones
- **RNC**: Formato de 9 o 11 dígitos
- **Cédula**: Formato XXX-XXXXXXX-X
- **NCF**: 3 letras + 8 dígitos (ej: B01########)

### Configuraciones Fiscales
- **Moneda**: DOP (Pesos Dominicanos)
- **Formato de Fecha**: DD/MM/YYYY
- **ITBIS**: 18% (configurable)
- **Precisión Monetaria**: 2 decimales

### Tipos de NCF Soportados
- **B01**: Facturas de Crédito Fiscal (requiere RNC válido)
- **B02**: Facturas de Consumo
- **B03**: Notas de Débito
- **B04**: Notas de Crédito
- **B11**: Proveedores Informales
- **B12**: Registro Único
- **B13**: Consumidor Final
- **B14**: Regímenes Especiales
- **B15**: Gubernamental

## 🗄️ Scripts Disponibles

- `npm run dev` - Ejecutar en modo desarrollo
- `npm run build` - Construir para producción
- `npm run start` - Ejecutar en modo producción
- `npm run lint` - Ejecutar linter
- `npm run db:migrate` - Ejecutar migraciones de base de datos
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:seed` - Sembrar datos iniciales
- `npm run db:studio` - Abrir Prisma Studio

## 👤 Usuario por Defecto

Después de ejecutar el seed:
- **Email**: admin@pos.do
- **Contraseña**: admin123
- **Rol**: Administrador

## 📁 Estructura del Proyecto

```
src/
├── app/                 # Páginas y rutas (App Router)
├── components/          # Componentes React reutilizables
├── lib/                 # Utilidades y configuraciones
├── types/               # Definiciones TypeScript
└── utils/               # Funciones de utilidad
    └── dominican-validators.ts  # Validadores específicos de RD
```

## 🔒 Seguridad

- Autenticación JWT
- Validación de entrada con Zod
- Sanitización de datos
- Control de acceso basado en roles
- Logs de auditoría completos

## 📝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para detalles.

## 🆘 Soporte

Para soporte, envía un email a support@pos.do o crea un issue en GitHub.

## 🏗️ Estado del Desarrollo

- [x] Configuración inicial del proyecto
- [x] Modelos de base de datos
- [x] Autenticación básica
- [x] Dashboard principal
- [x] API de autenticación (login/logout)
- [x] API de ventas (crear/listar)
- [x] API de productos (crear/listar)
- [x] Módulo de ventas (interfaz completa)
- [x] Gestión de inventario (visualización)
- [x] Navegación y componentes UI
- [x] Validadores dominicanos (RNC, NCF, etc.)
- [x] Cálculos de ITBIS y totales
- [x] Sistema de auditoría
- [x] Gestión de secuencias NCF (completa)
- [x] Sincronización con base de datos DGII
- [x] Búsqueda de clientes por RNC
- [x] Vista previa de recibos antes de imprimir
- [x] Soporte completo para facturas B01 y B02
- [ ] Gestión de clientes (módulo completo)
- [ ] Reportes DGII
- [ ] APIs de integración
- [ ] Configuración de sistema
- [ ] Gestión de usuarios
