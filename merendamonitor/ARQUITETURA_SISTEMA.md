# 🏗️ Arquitetura do Sistema MerendaMonitor

## 📐 Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph Frontend[Frontend - React + TypeScript]
        App[App.tsx<br/>Router Principal]
        Sidebar[Sidebar<br/>Navegação]
        
        subgraph School[Módulo Gestão Escolar]
            SchoolMgr[SchoolManager]
            StaffMgr[StaffManager]
            TeacherMgr[TeacherManager]
            GradeMgr[GradeManager]
            ClassMgr[ClassroomManager]
            StudentMgr[StudentManager]
            AttReg[AttendanceRegister]
            AttDash[AttendanceDashboard]
        end
        
        subgraph Kitchen[Módulo Merenda]
            Inventory[InventoryManager]
            Supply[SupplyManager]
            Daily[DailyRegister]
            Waste[WasteTracker]
            Recipe[RecipeManager]
            Calc[CookingCalculator]
            Menu[WeeklyMenu]
        end
        
        subgraph Control[Módulo Controles]
            Dashboard[Dashboard]
            WeekCtrl[WeeklyControl]
            MonthCtrl[MonthlyControl]
            SchoolCal[SchoolCalendar]
            Reports[Reports]
        end
        
        subgraph AI[Módulo IA]
            Notif[NotificationCenter]
            Advisor[AiAdvisor]
        end
    end
    
    subgraph Backend[Backend - Supabase]
        Auth[Autenticação]
        
        subgraph DB[PostgreSQL Database]
            SchoolTables[(schools<br/>staff<br/>teachers<br/>grades<br/>classrooms<br/>students<br/>daily_attendance)]
            KitchenTables[(ingredients<br/>consumption_logs<br/>supply_logs<br/>waste_logs<br/>recipes<br/>suppliers)]
        end
        
        RLS[Row Level Security]
        Views[Views Materializadas]
    end
    
    subgraph External[Serviços Externos]
        Gemini[Google Gemini AI]
        Vercel[Vercel Deploy]
    end
    
    App --> School
    App --> Kitchen
    App --> Control
    App --> AI
    
    School --> Auth
    Kitchen --> Auth
    Control --> Auth
    AI --> Auth
    
    Auth --> DB
    DB --> RLS
    DB --> Views
    
    Advisor --> Gemini
    App --> Vercel
```

---

## 🔄 Fluxo de Dados Principal

```mermaid
sequenceDiagram
    participant Prof as Professor
    participant Att as AttendanceRegister
    participant DB as Supabase
    participant Dash as AttendanceDashboard
    participant Mer as Merendeira
    participant Calc as Calculator
    
    Prof->>Att: Faz chamada da sala
    Att->>DB: Salva presença (daily_attendance)
    DB-->>Att: Confirmação ✅
    
    Mer->>Dash: Abre "Presença Hoje"
    Dash->>DB: Busca todas presenças do dia
    DB-->>Dash: Retorna total de presentes
    Dash->>Mer: Mostra número GIGANTE
    
    Mer->>Calc: Abre calculadora
    Calc->>DB: Pode buscar presença automaticamente
    Calc->>Mer: Calcula ingredientes para N alunos
    
    Note over Mer: Cozinha quantidade EXATA!
```

---

## 🗂️ Estrutura de Banco de Dados

### Módulo Gestão Escolar (9 tabelas)

```mermaid
erDiagram
    schools ||--o{ staff : has
    schools ||--o{ teachers : has
    schools ||--o{ grades : has
    schools ||--o{ classrooms : has
    schools ||--o{ students : has
    
    grades ||--o{ classrooms : belongs_to
    teachers ||--o{ classrooms : teaches
    
    classrooms ||--o{ students : enrolled_in
    classrooms ||--o{ daily_attendance : has
    
    daily_attendance ||--o{ student_attendance : detailed
    
    students ||--o{ student_transfers : has
    students ||--o{ student_attendance : marked

    schools {
        uuid id PK
        text name
        text inep_code
        text address
        text phone
        int total_capacity
    }
    
    staff {
        uuid id PK
        uuid school_id FK
        text name
        text role
        text phone
        text address
    }
    
    teachers {
        uuid id PK
        uuid school_id FK
        text name
        text phone
        text address
        text specialization
    }
    
    grades {
        uuid id PK
        uuid school_id FK
        text name
        text education_level
        int order_index
    }
    
    classrooms {
        uuid id PK
        uuid school_id FK
        uuid grade_id FK
        uuid teacher_id FK
        text name
        text shift
        int capacity
    }
    
    students {
        uuid id PK
        uuid school_id FK
        uuid classroom_id FK
        text name
        text guardian_name
        text guardian_phone
        text address
        bool has_food_restriction
    }
    
    daily_attendance {
        uuid id PK
        uuid classroom_id FK
        date date
        text shift
        int total_students
        int present_count
        int absent_count
    }
```

### Módulo Merenda (8 tabelas)

```mermaid
erDiagram
    ingredients ||--o{ consumption_logs : tracks
    ingredients ||--o{ supply_logs : receives
    ingredients ||--o{ waste_logs : wastes
    
    recipes ||--o{ recipe_ingredients : contains
    ingredients ||--o{ recipe_ingredients : used_in
    
    suppliers ||--o{ supply_logs : provides
    
    ingredients {
        uuid id PK
        text name
        text category
        numeric current_stock
        numeric min_threshold
    }
    
    consumption_logs {
        uuid id PK
        uuid ingredient_id FK
        date date
        numeric amount_used
        int student_count
    }
    
    supply_logs {
        uuid id PK
        uuid ingredient_id FK
        uuid supplier_id FK
        date date
        numeric amount_added
        date expiration_date
    }
    
    waste_logs {
        uuid id PK
        uuid ingredient_id FK
        date date
        numeric amount
        text reason
        numeric cost_impact
    }
    
    recipes {
        uuid id PK
        text name
        int servings
        numeric cost_per_serving
    }
```

---

## 🔐 Fluxo de Autenticação

```mermaid
graph LR
    User[Usuário] -->|Login| Auth[Supabase Auth]
    Auth -->|Token| App[App.tsx]
    App -->|Admin?| AdminMenu[Menu Completo<br/>23 telas]
    App -->|Cook?| CookMenu[Menu Simplificado<br/>8 telas]
    
    AdminMenu --> AllFeatures[Todas<br/>Funcionalidades]
    CookMenu --> LimitedFeatures[Funcionalidades<br/>Essenciais]
```

---

## 📱 Componentes e Responsabilidades

### Layer 1: Entrada de Dados
- **StudentManager** - CRUD de alunos
- **TeacherManager** - CRUD de professores
- **ClassroomManager** - CRUD de salas
- **SupplyManager** - Entrada de mercadorias
- **AttendanceRegister** - Registro de presença

### Layer 2: Processamento
- **services/analytics.ts** - Cálculos estatísticos
- **services/forecasting.ts** - Previsões de estoque
- **services/notifications.ts** - Geração de alertas

### Layer 3: Visualização
- **AttendanceDashboard** - Presença em tempo real
- **Dashboard** - Visão geral
- **WeeklyControl** - Análise semanal
- **MonthlyControl** - Análise mensal

### Layer 4: Saída
- **Reports** - Relatórios PDF/Excel
- **NotificationCenter** - Alertas
- **AiAdvisor** - Insights com IA

---

## 🎯 Pontos de Integração Críticos

### 1. Presença → Merenda

```typescript
// AttendanceDashboard busca presença
const totalPresent = attendances.reduce((acc, a) => acc + a.presentCount, 0);

// Merendeira usa este número
// CookingCalculator pode auto-preencher com este valor
```

### 2. Alunos com Restrições → Notificações

```typescript
// Sistema alerta merendeira sobre restrições alimentares
students.filter(s => s.hasFoodRestriction)
  .forEach(student => {
    // Gera notificação especial
  });
```

### 3. Calendário Escolar → Previsões

```typescript
// Previsões consideram apenas dias letivos
const schoolDays = calendar.filter(day => day.isSchoolDay);
const prediction = calculateForSchoolDays(schoolDays);
```

---

## 🔧 Stack Tecnológico

### Frontend
- **React 19** - UI Framework
- **TypeScript 5** - Type Safety
- **Vite 6** - Build Tool
- **Tailwind CSS** - Estilização
- **Lucide React** - Ícones
- **Recharts** - Gráficos

### Backend
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL 15
  - Row Level Security
  - Real-time subscriptions
  - Authentication

### External Services
- **Google Gemini AI** - Insights inteligentes
- **Vercel** - Deploy e hosting

### Libraries
- **jsPDF** - Geração de PDF
- **XLSX** - Geração de Excel
- **React Markdown** - Renderização de IA

---

## 📏 Métricas do Sistema

### Código
- **23** Componentes React
- **30+** Interfaces TypeScript
- **17** Tabelas no banco
- **~6.000** linhas de código

### Funcionalidades
- **23** Telas para Admin
- **8** Telas para Merendeira
- **4** Módulos principais
- **2** Scripts SQL

### Performance
- **<2s** Carregamento inicial
- **<500ms** Navegação entre telas
- **<1s** Salvamento de dados
- **Auto-refresh** a cada 5min no dashboard de presença

---

## 🎨 Design System

### Cores por Módulo
- 🟢 **Verde (Emerald)** - Base/Sidebar
- 🔵 **Azul** - Gestão de Alunos
- 🟣 **Roxo** - Professores
- 🟠 **Laranja** - Merenda/Cozinha
- 🟡 **Amarelo** - Alertas
- 🔴 **Vermelho** - Crítico/Desperdício
- 🔷 **Índigo** - Salas e Gestão

### Padrões de UI
- **Cards com gradiente** para headers importantes
- **Estatísticas em destaque** com números grandes
- **Badges coloridos** para status
- **Progress bars** para ocupação
- **Modais** para formulários complexos
- **Alertas contextuais** com ícones

---

## 🔮 Roadmap Futuro

### Fase 1 (Atual) ✅
- Gestão escolar completa
- Sistema de presença
- Controles de merenda

### Fase 2 (Próxima)
- App mobile para professores
- Push notifications
- Presença individual (nome por nome)
- QR Code para alunos

### Fase 3 (Futura)
- Multi-escola
- Dashboard consolidado
- Transferências entre escolas
- Relatórios nutricionais avançados

---

**Sistema arquitetado para escalar e evoluir! 🚀**
