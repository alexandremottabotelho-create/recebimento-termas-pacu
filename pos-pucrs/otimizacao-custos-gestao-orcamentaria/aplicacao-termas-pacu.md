# Aplicação no Termas Pacu

Como os conceitos das aulas 1 e 2 se conectam ao que já existe e ao que estamos
construindo. Este documento é proposta de trabalho: metas, valores e
responsáveis precisam ser definidos com dados reais.

## 1. O que já temos e onde se encaixa

O app de Validação de Recebimento grava cada item recebido na aba `CONFERENCIA`.
Na linguagem da disciplina, ele é a **fonte de dados de preço e de conformidade**
do pacote de compras.

| Campo da `CONFERENCIA` | Uso na gestão de gastos |
|---|---|
| Fornecedor, Descrição, Valor, Qtd Entregue, Unidade | Indicador de **preço** unitário por item e fornecedor (análise histórica e comparativa) |
| Qtd Pedida x Qtd Entregue | Divergência de entrega por fornecedor |
| Validade, Lote | Recebimento com validade vencida ou curta (risco de perda em A&B) |
| Status | Taxa de recusa ou ressalva por fornecedor |
| Prazo Negociado | Base para análise de prazo de pagamento na negociação |
| Pedido/Requisição | Elo entre o recebido e o que foi autorizado |
| Setor, Categoria (A&B / Obra) | **Entidade** e **pacote** do controle matricial |
| Volume m³ (lenha, areia, pedra, toco) | Preço por m³ medido x m³ faturado |

## 2. Conceito → aplicação

| Conceito da aula | Aplicação prática | Depende de |
|---|---|---|
| Despesa = preço × consumo | Separar no Power BI o que é variação de preço do que é variação de consumo em A&B e Obra | Preço: já temos. Consumo: falta denominador |
| Parâmetro com causa e efeito | Usar hóspedes ou UHs ocupadas como parâmetro de consumo de A&B | Dado de ocupação fora do app |
| Controle matricial | Definir gestores de pacote (A&B, manutenção/obra, lenha, utilidades) e de entidade (setores) | Decisão da diretoria |
| Análise histórica | Curva de preço unitário por item ao longo dos meses, com sazonalidade de temporada | Histórico acumulado na planilha |
| Análise comparativa | Comparar fornecedores do mesmo item (preço, divergência, recusa) | Padronização da descrição dos itens |
| Análise de contratos | Lista de contratos com vigência e janela de renegociação | Levantamento fora do app |
| Base Zero | Para serviços sem histórico confiável: definir nível atual, regular e mínimo e o custo de cada | Escolha dos serviços-piloto |
| Lógica das torres | Mapear entregas das áreas de apoio e priorizar | Entrevista com gestores |
| 5W2H | Todo desvio relevante no recebimento vira ação com dono e prazo | Rotina de reunião |
| Rituais N1/N2/N3 | N3 diário na portaria/almoxarifado; N2 semanal compras e cozinha; N1 mensal diretoria | Calendário |
| Gestão à vista | Painel Power BI de recebimento exibido para compras e almoxarifado | Dashboard |
| Forecast | Projeção de fechamento do mês por pacote | Orçamento por pacote |

## 3. Indicadores propostos (a partir da `CONFERENCIA`)

| Indicador | Fórmula | Leitura |
|---|---|---|
| Preço unitário médio | Σ Valor ÷ Σ Qtd Entregue, por item e fornecedor | Alvo de renegociação |
| Lacuna de preço | Preço médio − menor preço praticado no período | Potencial de ganho |
| Divergência de quantidade | Itens com entregue ≠ pedida ÷ total de itens | Qualidade do fornecedor e do pedido |
| Recebimento com validade crítica | Itens vencidos ou próximos do vencimento ÷ itens com validade | Risco de perda |
| Taxa de recusa/ressalva | Itens com status não conforme ÷ total | Qualidade do fornecedor |
| Recebimento sem pedido | NFs sem Pedido/Requisição ÷ total de NFs | Compra fora do processo |
| Preço da lenha por m³ medido | Valor ÷ Volume m³ apurado na cubagem | Compara com o m³ faturado |

Atenção: o campo `Valor` precisa de regra única (unitário ou total do item)
para que o preço unitário seja confiável. Confirmar como a portaria preenche.

## 4. Riscos e pontos de atenção

- **Descrição livre de item** impede comparar preço entre fornecedores. Sem
  cadastro padronizado, a análise comparativa não fecha.
- **Sem dado de ocupação**, só medimos preço; o consumo fica cego.
- **Meta sem dono não se cumpre**: indicador sem gestor de pacote vira relatório.
- **Corte linear** é o erro que a disciplina combate: priorizar por lacuna, não
  por tamanho da conta.

## 5. Sequência recomendada

1. Validar a regra do campo `Valor` e padronizar descrições de item.
2. Publicar no Power BI os indicadores da seção 3 (preço, divergência, recusa,
   sem pedido).
3. Definir gestores de pacote e a rotina N3/N2/N1.
4. Trazer ocupação (hóspedes/UH) para abrir o indicador de consumo.
5. Escolher um pacote-piloto (sugestão: A&B ou lenha) para negociar metas com
   base na lacuna.
