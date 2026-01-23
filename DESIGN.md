# Buenos Aires Tango Tours - Documentación de Diseño

## Paleta de Colores

| Token | Valor | Uso |
|-------|-------|-----|
| Background | `oklch(0.06 0 0)` - Negro profundo | Fondo principal |
| Foreground | `oklch(0.98 0 0)` - Blanco | Texto principal |
| Card | `oklch(0.1 0 0)` - Negro suave | Tarjetas y contenedores |
| Muted | `oklch(0.18 0 0)` - Gris oscuro | Fondos secundarios |
| Muted Foreground | `oklch(0.6 0 0)` - Gris medio | Texto secundario |
| Border | `oklch(0.25 0 0)` - Gris carbón | Bordes y separadores |
| Primary | `oklch(0.98 0 0)` - Blanco | Botones y elementos destacados |
| Primary Foreground | `oklch(0.06 0 0)` - Negro | Texto sobre elementos primarios |

---

## Tipografía

| Tipo | Fuente | Uso |
|------|--------|-----|
| Headings | Playfair Display (serif) | Títulos, subtítulos, logo |
| Body | Inter (sans-serif) | Texto de párrafos, labels, botones |

### Escala Tipográfica

- **Hero Title**: `text-5xl` / `md:text-7xl` - Playfair Display
- **Section Title**: `text-3xl` / `md:text-4xl` - Playfair Display
- **Card Title**: `text-xl` / `text-2xl` - Playfair Display
- **Body**: `text-base` / `text-lg` - Inter
- **Small/Caption**: `text-sm` - Inter

---

## Estructura de Secciones

### 1. Header (Navegación)
- **Posición**: Fija en la parte superior
- **Fondo**: Transparente con blur (backdrop-blur)
- **Contenido**:
  - Logo en tipografía serif (izquierda)
  - Links de navegación con smooth scroll (centro/derecha)
  - Botón CTA "Reservar Tour" (derecha)
  - Menú hamburguesa en móvil

### 2. Hero
- **Layout**: Pantalla completa (min-h-screen)
- **Fondo**: Imagen con overlay negro semitransparente
- **Contenido**:
  - Título principal en serif grande
  - Subtítulo descriptivo
  - Dos botones CTA: "Reservar Ahora" (primario) y "Ver Tours" (outline)
  - Indicador de scroll animado (chevron)

### 3. About
- **Layout**: Dos columnas en desktop, una en móvil
- **Columna Izquierda**: Imagen del guía con borde decorativo
- **Columna Derecha**:
  - Título de sección
  - Texto de presentación personal
  - Estadísticas destacadas (años de experiencia, tours realizados, reviews)

### 4. Services (Tours)
- **Layout**: Grid responsive (1 col móvil, 2 cols tablet, 3 cols desktop)
- **5 Tarjetas de Tour**:
  1. **Tour Privado** - Experiencia personalizada
  2. **Tour Grupal** - Grupos pequeños
  3. **Tour Educacional** - Para estudiantes
  4. **Tour Corporativo** - Empresas y team building
  5. **Tour Universitario** - Grupos universitarios

- **Estructura de cada tarjeta**:
  - Icono representativo
  - Nombre del tour
  - Descripción breve
  - Duración y precio
  - Lista de incluidos (checkmarks)
  - Botón de reserva

### 5. Gallery
- **Layout**: Grid masonry/bento
- **Funcionalidad**:
  - Click en imagen abre lightbox
  - Navegación con flechas izquierda/derecha
  - Cierre con click fuera, tecla ESC o botón X
- **Imágenes**:
  - Bailarines de tango
  - Barrio San Telmo
  - Interior de milonga
  - Orquesta de tango
  - La Boca / Caminito

### 6. Map
- **Layout**: Dos columnas (info + mapa)
- **Columna Izquierda**:
  - Título de sección
  - Descripción de ubicaciones
  - Lista de barrios: San Telmo, La Boca, Abasto, Palermo
- **Columna Derecha**: Iframe de Google Maps embebido

### 7. Booking (Reservas)
- **Integración**: Cal.com via iframe
- **Layout**: Contenedor centrado con título y descripción
- **Nota**: Reemplazar URL del iframe con tu calendario de Cal.com

### 8. Ebook
- **Layout**: Dos columnas (imagen + contenido)
- **Columna Izquierda**: Imagen de portada del ebook
- **Columna Derecha**:
  - Título del ebook
  - Descripción
  - Lista de contenidos incluidos
  - Precio con descuento visible
  - Botón de compra

### 9. Contact
- **Layout**: Dos columnas (formulario + info)
- **Formulario**:
  - Campo nombre
  - Campo email
  - Campo asunto
  - Campo mensaje (textarea)
  - Botón enviar
- **Info de Contacto**:
  - Email
  - WhatsApp (con link directo)
  - Redes sociales (Instagram, Facebook, YouTube)

### 10. Footer
- **Contenido**:
  - Logo
  - Links de navegación rápida
  - Links legales (Privacidad, Términos)
  - Iconos de redes sociales
  - Copyright

---

## Componentes UI

| Componente | Variantes | Uso |
|------------|-----------|-----|
| Button | default, outline, ghost | CTAs, formularios, navegación |
| Card | default | Servicios, contenedores |
| Input | default | Campos de formulario |
| Textarea | default | Campo de mensaje |
| Label | default | Etiquetas de formulario |

---

## Responsive Design

| Breakpoint | Ancho | Comportamiento |
|------------|-------|----------------|
| Mobile | < 768px | 1 columna, menú hamburguesa, texto más pequeño |
| Tablet | 768px - 1024px | 2 columnas, navegación visible |
| Desktop | > 1024px | Layout completo, todas las columnas |

---

## Animaciones y Transiciones

- **Hover en botones**: Cambio de opacidad/color suave
- **Hover en tarjetas**: Elevación sutil (translate-y)
- **Navegación**: Smooth scroll entre secciones
- **Lightbox**: Fade in/out
- **Header**: Backdrop blur al hacer scroll
- **Scroll indicator**: Animación de bounce infinito

---

## Integraciones Externas

### Cal.com (Reservas)
- **Archivo**: `/components/booking.tsx`
- **Acción**: Reemplazar `https://cal.com` con tu URL personal
- **Ejemplo**: `https://cal.com/tu-usuario/tango-tour`

### Google Maps
- **Archivo**: `/components/map-section.tsx`
- **Ubicación actual**: San Telmo, Buenos Aires
- **Personalización**: Modificar coordenadas en el iframe si es necesario

### WhatsApp
- **Archivo**: `/components/contact.tsx`
- **Formato**: `https://wa.me/TUNUMERO`
- **Acción**: Reemplazar con tu número de WhatsApp

### Redes Sociales
- **Archivos**: `/components/contact.tsx`, `/components/footer.tsx`
- **Acción**: Reemplazar URLs placeholder con tus perfiles reales

---

## Archivos del Proyecto

```
/app
  ├── globals.css          # Variables de tema y estilos globales
  ├── layout.tsx           # Layout principal con fuentes
  └── page.tsx             # Página principal que importa componentes

/components
  ├── header.tsx           # Navegación principal
  ├── hero.tsx             # Sección hero
  ├── about.tsx            # Sección sobre el guía
  ├── services.tsx         # Tarjetas de tours
  ├── gallery.tsx          # Galería con lightbox
  ├── map-section.tsx      # Mapa de ubicaciones
  ├── booking.tsx          # Integración Cal.com
  ├── ebook.tsx            # Promoción del ebook
  ├── contact.tsx          # Formulario de contacto
  └── footer.tsx           # Pie de página

/public/images
  ├── hero-tango.jpg       # Imagen principal del hero
  ├── guide-portrait.jpg   # Foto del guía
  ├── gallery-1.jpg        # Galería: pies de bailarines
  ├── gallery-2.jpg        # Galería: San Telmo
  ├── gallery-3.jpg        # Galería: milonga
  ├── gallery-4.jpg        # Galería: orquesta
  ├── gallery-5.jpg        # Galería: La Boca
  └── ebook-cover.jpg      # Portada del ebook
```

---

## Checklist de Personalización

- [ ] Reemplazar textos placeholder con contenido real
- [ ] Configurar URL de Cal.com en booking.tsx
- [ ] Agregar número de WhatsApp real
- [ ] Configurar links de redes sociales
- [ ] Actualizar precios de tours
- [ ] Reemplazar imágenes con fotos propias (opcional)
- [ ] Configurar formulario de contacto (backend/email)
- [ ] Agregar link de compra real para el ebook
