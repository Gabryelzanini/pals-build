# Fontes de dados da Palpedia

Pesquisa realizada em 11 de novembro de 2026.

## Escolha para o PalsBuild

### 1. PalworldOnline — fonte principal da listagem

Endpoint: `https://www.palworldonline.net/assets/palworld-encyclopedia-1.0.4.json`

- 299 perfis na versão 1.0.4.
- Arquivo estático, sem chave e sem limite de requisições.
- CORS habilitado para consumo direto pelo navegador.
- Inclui número da Palpedia, elementos, raridade, estatísticas, movimento, trabalhos, habilidades, drops e dados de obtenção.
- Não inclui imagens nem textos editoriais.

É a melhor opção para o primeiro protótipo porque uma única requisição entrega a Palpedia inteira e não cria dependência de credenciais.

### 2. palworld-knowledge — enriquecimento e PT-BR

Repositório: `https://github.com/GGarnize/palworld-knowledge`

- Dados normalizados diretamente dos arquivos atuais do jogo.
- Nomes oficiais em PT-BR e inglês.
- IDs internos com capitalização correta, usados para relacionar os registros aos ícones.
- Schemas, validação cruzada e metadados de build.
- Atualização automatizada quando o build do servidor dedicado muda.

O PalsBuild cruza essa fonte pelo nome/ID para adicionar localização e manter uma ponte estável com recursos visuais.

## Alternativa avaliada: PalDB API

Documentação: `https://paldb.gg/developers/`

É a API mais completa e bem documentada para detalhes individuais, itens, habilidades, passivas, reprodução e histórico de atualizações. Em 11/11/2026 ela informa 288 Pals e dados extraídos do build 4570950001. Porém, o acesso sem chave é limitado a 300 requisições por hora por IP. Ela é uma boa candidata para páginas de detalhes e calculadoras futuras, mas não é a fonte principal da listagem inicial para evitar limites em IPs compartilhados.

## Habilidades de parceiro no Criador de times

- Nomes e descrições em PT-BR: `https://palworld.gg/pt-BR/partner-skills`, consultados por uma rota interna com cache.
- Quando uma habilidade não aparece na primeira página da listagem, o PalsBuild consulta a página PT-BR individual do Pal e mantém o resultado em cache.
- Categorias de efeito usam internamente `https://github.com/MagitekZed/palworld-helper/blob/main/data/pals_partner_skills.json`, mas os textos dessa fonte em inglês nunca são exibidos.
- Estatísticas usadas no resumo continuam vindo da base factual principal do PalworldOnline.

## Conteúdo detalhado em PT-BR

- Habilidades de parceiro, habilidades ativas e nomes de itens derrubados são obtidos das páginas `https://palworld.gg/pt-BR/pal/<pal>` por uma rota interna com cache.
- Se a fonte PT-BR estiver indisponível, a interface mostra uma mensagem neutra em português em vez de recorrer a descrições em inglês.
- As requisições do navegador possuem limite de 12 segundos para impedir carregamentos infinitos.
- Respostas PT-BR válidas usam cache HTTP; falhas externas recebem `Cache-Control: no-store`.

## Imagens

O protótipo referencia os ícones públicos exibidos pelo site de referência e usa o repositório MIT `mlg404/palworld-paldex-api` como fallback para os primeiros registros. Antes de publicar comercialmente, deve-se revisar o uso e a redistribuição dos assets visuais de Palworld e, de preferência, substituir o hotlink por um pipeline de assets autorizado.

## Atribuição

Os créditos ficam visíveis no rodapé da aplicação. O projeto também deve manter o aviso de que não é afiliado nem endossado pela Pocketpair, Inc.
