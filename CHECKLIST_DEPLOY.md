# ✅ Checklist de Deploy - MerendaMonitor v2.0

Use este checklist para garantir que tudo foi configurado corretamente.

---

## 📋 PRÉ-DEPLOY (Local)

### 1. Banco de Dados Supabase

- [ ] Acessar https://app.supabase.com
- [ ] Abrir o projeto MerendaMonitor
- [ ] Ir em **SQL Editor**
- [ ] Executar `scripts/add_new_features.sql` (copiar e colar)
- [ ] Executar `scripts/setup_school_management.sql` (copiar e colar)
- [ ] Verificar se todas as tabelas foram criadas:
  - [ ] `recipes`
  - [ ] `waste_logs`
  - [ ] `suppliers`
  - [ ] `schools`
  - [ ] `staff`
  - [ ] `teachers`
  - [ ] `grades`
  - [ ] `classrooms`
  - [ ] `students`
  - [ ] `daily_attendance`

### 2. Testar Localmente

- [ ] Rodar `npm run dev`
- [ ] Abrir http://localhost:5173
- [ ] Fazer login como admin
- [ ] Verificar se o menu tem 4 seções (Principal, Gestão Escolar, Merenda, Controles)
- [ ] Clicar em algumas telas novas para verificar se carregam sem erro
- [ ] Abrir o console do navegador (F12) e verificar se não há erros em vermelho

---

## 🚀 DEPLOY PARA PRODUÇÃO

### 3. Git Commit & Push

Execute no terminal:

```powershell
# 1. Ver o que mudou
git status

# 2. Adicionar todos os arquivos
git add .

# 3. Fazer commit
git commit -m "feat: Sistema completo de gestão escolar com presença em tempo real integrada à merenda"

# 4. Enviar para GitHub/GitLab
git push origin main
```

### 4. Aguardar Deploy no Vercel

- [ ] Acessar https://vercel.com
- [ ] Ir no projeto MerendaMonitor
- [ ] Ver se o deploy iniciou automaticamente
- [ ] Aguardar build finalizar (~2-3 min)
- [ ] Clicar em "Visit" para abrir o site
- [ ] Fazer login e verificar se as telas novas aparecem

---

## ⚙️ CONFIGURAÇÃO INICIAL (Produção)

### 5. Cadastros Iniciais (Na ordem!)

**Passo 1: Dados da Escola**
- [ ] Menu: Gestão Escolar → Dados da Escola
- [ ] Preencher todos os campos
- [ ] Salvar

**Passo 2: Cadastrar Séries**
- [ ] Menu: Gestão Escolar → Séries
- [ ] Criar: Pré-escola, 1º Ano, 2º Ano, 3º Ano, 4º Ano, 5º Ano
- [ ] (Ou as séries que sua escola atende)

**Passo 3: Cadastrar Professores**
- [ ] Menu: Gestão Escolar → Professores
- [ ] Cadastrar pelo menos 2-3 professores de teste
- [ ] Incluir nome, telefone, endereço

**Passo 4: Criar Salas**
- [ ] Menu: Gestão Escolar → Salas/Turmas
- [ ] Criar uma sala de teste
- [ ] Vincular à série
- [ ] Vincular a um professor
- [ ] Definir turno (Manhã/Tarde)

**Passo 5: Cadastrar Alunos**
- [ ] Menu: Gestão Escolar → Alunos
- [ ] Cadastrar 5-10 alunos de teste
- [ ] Vincular à sala criada
- [ ] Preencher dados do responsável
- [ ] Marcar restrições alimentares (se houver)

---

## 🧪 TESTE DO FLUXO COMPLETO

### 6. Testar Sistema de Presença

**Como Professor/Coordenador:**
- [ ] Menu: Fazer Chamada
- [ ] Selecionar a sala de teste
- [ ] Digitar número de presentes (ex: 8 de 10)
- [ ] Salvar
- [ ] Ver checkmark verde confirmando

**Como Merendeira:**
- [ ] Menu: 📊 Presença Hoje
- [ ] Ver o número GIGANTE de alunos presentes
- [ ] Verificar se o alerta está VERDE (todas salas registraram)
- [ ] Clicar em "Atualizar" para refresh

---

## 📊 TESTES ADICIONAIS

### 7. Testar Outras Funcionalidades

- [ ] **Desperdícios:** Registrar um desperdício teste
- [ ] **Receitas:** Criar uma receita com ingredientes
- [ ] **Fornecedores:** Cadastrar um fornecedor
- [ ] **Controle Semanal:** Ver gráficos da semana
- [ ] **Controle Mensal:** Ver dashboard do mês
- [ ] **Notificações:** Ver se aparecem alertas de estoque

---

## 🎯 VALIDAÇÕES FINAIS

### 8. Checklist de Qualidade

- [ ] Login funciona
- [ ] Menu lateral aparece completo
- [ ] Todas as telas carregam sem erro 404
- [ ] Não há erros no console (F12)
- [ ] Dashboard de presença mostra número correto
- [ ] Calculadora de merenda funciona
- [ ] Relatórios geram PDF
- [ ] Dados salvam no banco (não some ao recarregar)

---

## 🐛 Solução de Problemas

### Erro: "Table not found"
**Solução:** Você não executou os scripts SQL. Vá no Supabase e execute-os.

### Erro: "Nenhum dado aparece"
**Solução:** Cadastre dados de teste primeiro (escola, séries, salas, alunos).

### Menu não aparece completo
**Solução:** Limpe cache do navegador (Ctrl+Shift+Delete) e recarregue.

### Presença não atualiza
**Solução:** Clique no botão "Atualizar" no dashboard de presença.

---

## 📱 Teste em Diferentes Dispositivos

- [ ] Desktop (Chrome/Edge)
- [ ] Tablet (iPad/Android)
- [ ] Mobile (se houver tempo)

---

## 🎉 PRONTO!

Quando todos os itens estiverem marcados, seu sistema está:

✅ Funcionando em produção  
✅ Com dados de teste  
✅ Pronto para uso real  
✅ Pronto para treinar os usuários  

---

## 👥 Próximo Passo: Treinamento

**Quem treinar:**
1. Merendeira - Foco no Dashboard de Presença
2. Professores - Foco no Registro de Chamada
3. Secretaria - Foco em Cadastros
4. Direção - Foco em Relatórios

**Ordem de treinamento:**
1. Cadastros (1h)
2. Presença diária (30min)
3. Merenda (30min)
4. Relatórios (30min)

---

**Boa sorte com o deploy! 🚀**
