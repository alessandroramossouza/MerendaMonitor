-- Script para inserir uma escola de teste caso não exista nenhuma
-- Execute este script no Supabase SQL Editor se você ainda não tiver uma escola cadastrada

-- Primeiro, verificar se já existe alguma escola
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM schools LIMIT 1) THEN
    INSERT INTO schools (name, address, city, state, phone, email, is_active)
    VALUES (
      'Escola Municipal Exemplo',
      'Rua Principal, 123',
      'Cidade',
      'Estado',
      '(11) 1234-5678',
      'escola@exemplo.com',
      true
    );
    RAISE NOTICE 'Escola de teste inserida com sucesso!';
  ELSE
    RAISE NOTICE 'Já existe pelo menos uma escola cadastrada.';
  END IF;
END $$;

-- Verificar as escolas existentes
SELECT id, name, is_active FROM schools;
