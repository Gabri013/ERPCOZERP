-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Tempo de geração: 16/04/2026 às 22:03
-- Versão do servidor: 10.4.32-MariaDB
-- Versão do PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `dbcozinca`
--
CREATE DATABASE IF NOT EXISTS `dbcozinca` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dbcozinca`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `centro_custo`
--

CREATE TABLE `centro_custo` (
  `id` int(11) NOT NULL,
  `nome` varchar(120) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `cfop`
--

CREATE TABLE `cfop` (
  `id` int(11) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descricao` varchar(200) NOT NULL,
  `tipo` enum('entrada','saida','servico') NOT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `cfop`
--

INSERT INTO `cfop` (`id`, `codigo`, `descricao`, `tipo`, `observacoes`, `created_at`) VALUES
(1, '5101', 'Venda de mercadoria adquirida', 'saida', NULL, '2026-04-16 15:24:20'),
(2, '5102', 'Venda de mercadoria - Substitui????o Tribut??ria', 'saida', NULL, '2026-04-16 15:24:20'),
(3, '5205', 'Presta????o de servi??o', 'servico', NULL, '2026-04-16 15:24:20'),
(4, '6101', 'Venda de mercadoria purchased interstate', 'saida', NULL, '2026-04-16 15:24:20'),
(5, '6102', 'Venda de mercadoria - ICM Substitution', 'saida', NULL, '2026-04-16 15:24:20'),
(6, '1201', 'Devolu????o de mercadoria', 'entrada', NULL, '2026-04-16 15:24:20'),
(7, '2201', 'Compra de mercadoria', 'entrada', NULL, '2026-04-16 15:24:20'),
(8, '5201', 'Presta????o de servi??o collected', 'servico', NULL, '2026-04-16 15:24:20');

-- --------------------------------------------------------

--
-- Estrutura para tabela `clientes`
--

CREATE TABLE `clientes` (
  `id` int(11) NOT NULL,
  `razao_social` varchar(200) NOT NULL,
  `nome_fantasia` varchar(200) DEFAULT NULL,
  `responsavel` varchar(150) DEFAULT NULL,
  `cnpj_cpf` varchar(20) DEFAULT NULL,
  `inscricao_estadual` varchar(20) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `clientes`
--

INSERT INTO `clientes` (`id`, `razao_social`, `nome_fantasia`, `responsavel`, `cnpj_cpf`, `inscricao_estadual`, `endereco`, `cidade`, `estado`, `cep`, `telefone`, `email`, `observacoes`, `created_at`, `updated_at`) VALUES
(20, 'Tiao burguer', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-05 08:43:08', '2026-03-05 08:43:08'),
(21, 'MultiMak', '', NULL, '', '', '', '', '', '', '3199557750', '', NULL, '2026-03-05 08:50:18', '2026-03-05 08:50:18'),
(22, 'CARILA&#039;S BURGER LTDA', 'AV FREI BENJAMIM, 2345, BRASIL, VITORIA DA CONQUISTA - BA', NULL, '53.320.548/0001-85', '', '', '', '', '', '77 8852-0335', ': CARILASBURGER@GMAIL.COM', NULL, '2026-03-05 10:00:58', '2026-03-05 10:00:58'),
(23, 'NACOES BURGUER LTDA', 'NACOES BURGUER', NULL, '28.727.610/0001-00', '', '', '', '', '', '', 'NACOESBURGUER@GMAIL.COM', NULL, '2026-03-05 13:59:29', '2026-03-05 13:59:29'),
(24, 'Villa oba Restaurante e Pizzaria LTDA', 'Vila oba - Passos', NULL, '227787487000150', '', '', '', '', '', '', '', NULL, '2026-03-06 15:35:01', '2026-03-06 15:35:01'),
(25, 'testenilton', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-10 14:41:44', '2026-03-10 14:41:44'),
(26, 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', NULL, '59.315.327/0001-03', '', '', '', '', '', '(31) 99878-2479', 'WESTBURGEER@GMAIL.COM', NULL, '2026-03-12 11:11:34', '2026-03-12 11:11:34'),
(27, 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', NULL, '59.315.327/0001-03', '', '', '', '', '', '(31) 99878-2479', 'WESTBURGEER@GMAIL.COM', NULL, '2026-03-12 12:32:50', '2026-03-12 12:32:50'),
(28, 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', NULL, '59.315.327/0001-03', '', '', '', '', '', '(31) 99878-2479', 'WESTBURGEER@GMAIL.COM', NULL, '2026-03-12 12:32:58', '2026-03-12 12:32:58'),
(29, 'CASA DO HAMBURGUER LTDA', '', NULL, '51.096.590/0001-39', '', '', '', '', '', '(69) 99254-7598', 'FATORCONTABILPB@GMAIL.COM', NULL, '2026-03-12 12:51:52', '2026-03-12 12:51:52'),
(30, 'BABY SMASH COMERCIO DE GENEROS', 'BABY SMASH', NULL, '63075726000103', '', '', '', '', '', '(91) 989501236', 'BABYSMASHBELEM@GMAIL.COM', NULL, '2026-03-12 12:58:12', '2026-03-12 12:58:12'),
(31, 'SAULO', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-14 14:01:50', '2026-03-14 14:01:50'),
(32, 'SAULO', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-14 14:01:52', '2026-03-14 14:01:52'),
(33, 'JAIRO MEDEIROS DE SOUZA', 'JAIRO', NULL, '55408045000191', '', '', '', '', '', '(61) 9813-9247', 'medeirosjairo037@gmail.com', NULL, '2026-03-17 11:26:04', '2026-03-17 11:26:04'),
(34, 'PRISCILA DE CASTRO ANDRADE', '', NULL, '50.609.016/0001-74', '', '', '', '', '', '(82) 98207-6254', 'THIAGO2013@LIVE.COM', NULL, '2026-03-19 11:20:29', '2026-03-19 11:20:29'),
(35, 'PEDRO HENRIQUE MARTINS SANTANA', 'FOFOCAS BAR', NULL, '05.549.428/0001-01', '', '', '', '', '', '(38) 98827-2182', 'CONTSENA@UAI.COM.BR', NULL, '2026-03-19 17:41:37', '2026-03-19 17:41:37'),
(36, 'Haus Burguer', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-24 22:15:29', '2026-03-24 22:15:29'),
(37, 'Lista/ Japones', 'Av. José Maria Alkimin, 86 - Belvedere, Belo Horizonte - MG, 30320-210', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-24 22:39:11', '2026-03-24 22:39:11'),
(38, 'Saboreando', '', NULL, '', '', '', '', '', '', '', '', NULL, '2026-03-24 22:50:45', '2026-03-24 22:50:45'),
(39, 'Conect vendas', '', 'Rodrigo', '', '', '', '', '', '', '31984949018', '', NULL, '2026-03-30 08:44:53', '2026-03-30 08:44:53'),
(40, 'Consulte vendas', '', 'Rodrigo', '', '', '', '', '', '', '31 8494-9018', '', NULL, '2026-03-30 16:25:08', '2026-03-30 16:25:08'),
(41, 'Restaurante Turvo', '', '', '', '', '', '', '', '', '', '', NULL, '2026-03-31 12:22:22', '2026-03-31 12:22:22'),
(42, 'Seu Larica ltda', '', 'Diego', '46320531000162', '', 'Rua Luiz Simões Lopes, 17 Bangu - Rio de Janeiro / RJ CEP: 21863140', '', '', '', '21982168855', '', NULL, '2026-03-31 13:28:21', '2026-03-31 13:28:21'),
(43, 'Jardel', '', '', '', '', '', '', '', '', '', '', NULL, '2026-04-08 07:01:31', '2026-04-08 07:01:31'),
(44, 'Lista/ japonês', 'Lista/ japonês', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-08 17:50:41', '2026-04-08 17:50:41'),
(45, 'Haus burguer', 'Haus burguer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-08 17:54:43', '2026-04-08 17:54:43'),
(46, 'Conect vendas', 'Conect vendas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-08 18:37:19', '2026-04-08 18:37:19'),
(47, 'Leonario', '', '', '', '', '', '', '', '', '31 9898-4438', 'leonarioguedes@hotmail.com', NULL, '2026-04-09 09:40:46', '2026-04-09 09:40:46'),
(48, 'Caique souza', '', '', '', '', '', '', '', '', '+55 77 8852-0335', '', NULL, '2026-04-09 11:03:30', '2026-04-09 11:03:30'),
(49, 'Balcóes refrigerados.', 'Balcóes refrigerados.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2026-04-13 10:28:03', '2026-04-13 10:28:03'),
(50, 'ILTON MATOS', '', 'ILTON', '08776040000131', '', '', '', '', '', '(33) 99964-1251', '', NULL, '2026-04-14 13:11:01', '2026-04-14 13:11:01'),
(51, 'EVERTON ELVER DOS SANTOS', '', 'EVERTON', '487694770000162', '', '', '', '', '', '(31) 997281636', '', NULL, '2026-04-14 13:15:16', '2026-04-14 13:15:16'),
(52, 'BRUNO PRATES DE LIMA', '', 'BRUNO', '117825496-84', '', '', '', '', '', '(31) 986644689', '', NULL, '2026-04-14 13:17:06', '2026-04-14 13:17:06'),
(53, 'Corrêa Gonçalves e Guimarães Alimentos Ltda', '', '', '36382338000100', '36715530033', 'Avenida Raja Gabaglia, 2000 - LOJA 06PAVMTO1BLOCO1 Estoril - Belo Horizonte / MG CEP: 30494170', '', '', '', '31 9880-7202', '', NULL, '2026-04-14 19:51:46', '2026-04-14 19:51:46'),
(54, 'VINICIUS OLIVEIRA HAMBURGUERIA', 'PELOTAS SANDWICHES E BURGERS', 'VINÍCIUS', '52720062000171', '132248969117', 'RUA SOUSA LOPES, 192, ANEXO 204, LAUZANE PAULISTA, SÃO PAULO - SP', '', '', '', '(11) 959733112', 'PELOTASFOOD@OUTLOOK.COM', NULL, '2026-04-15 10:27:53', '2026-04-15 10:27:53'),
(55, '60.975.084 DAUTO LUIZ DE AGUIAR JUNIOR', '', 'DAUTO', '60975084000100', '263620522', 'ROD DEPUTADO PAULINO BURIGO, 3100 - SALA LIRI - Içara / SC', '', '', '', '(48) 96564553', 'DTNANO@HOTMAIL.COM', NULL, '2026-04-15 10:37:17', '2026-04-15 10:37:17'),
(56, 'KI-DELICIA LTDA', 'KI-DELICIA', 'KEVEN', '45384611000119', '42759760057', 'Rua Santa Luzia, 2069 - LOJA A Nossa Senhora de Fátima - Sabará / MG CEP: 34600010', '', '', '', '(31) 982507911', 'NAIANESUELEN@HOTMAIL.COM', NULL, '2026-04-15 10:42:09', '2026-04-15 10:42:09');

-- --------------------------------------------------------

--
-- Estrutura para tabela `componentes_produto`
--

CREATE TABLE `componentes_produto` (
  `id` int(11) NOT NULL,
  `estrutura_id` int(11) NOT NULL,
  `insumo_id` int(11) DEFAULT NULL,
  `componente_nome` varchar(180) NOT NULL,
  `quantidade` decimal(12,2) NOT NULL DEFAULT 1.00,
  `unidade` varchar(20) NOT NULL DEFAULT 'un',
  `custo_unitario` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `componentes_produto`
--

INSERT INTO `componentes_produto` (`id`, `estrutura_id`, `insumo_id`, `componente_nome`, `quantidade`, `unidade`, `custo_unitario`, `created_at`) VALUES
(38, 2, 1, 'Resistëncia', 3.00, 'un', 80.0000, '2026-04-15 11:56:58'),
(39, 2, 2, 'Chapa inox', 13.00, 'kg', 21.0000, '2026-04-15 11:56:58'),
(40, 2, 3, 'Chave 30a Botáo liga/desliga', 2.00, 'un', 16.0000, '2026-04-15 11:56:58'),
(41, 2, 4, 'Controlador STC1000', 2.00, 'un', 39.9000, '2026-04-15 11:56:58'),
(42, 2, 5, 'Manta fibra vidro', 1.00, 'un', 75.0000, '2026-04-15 11:56:58'),
(43, 2, 6, 'Manta lá de rocha', 1.00, 'un', 65.0000, '2026-04-15 11:56:58'),
(44, 2, 7, 'terminais', 1.00, 'un', 5.0000, '2026-04-15 11:56:58'),
(45, 2, 8, 'Tomada Prensada 20A', 1.00, 'un', 32.0000, '2026-04-15 11:56:58'),
(46, 2, 9, 'Adesivo Resinado', 1.00, 'un', 45.0000, '2026-04-15 11:56:58'),
(47, 2, 10, 'Cubas Gns 1/3x100', 6.00, 'un', 270.0000, '2026-04-15 11:56:58'),
(48, 2, 11, 'Parafuso inox', 1.00, 'un', 6.0000, '2026-04-15 11:56:58'),
(49, 2, 12, 'Parafuso comum', 1.00, 'un', 8.0000, '2026-04-15 11:56:58'),
(50, 1, 13, 'Resistencia 800w', 2.00, 'un', 0.0000, '2026-04-15 11:57:09');

-- --------------------------------------------------------

--
-- Estrutura para tabela `conciliacao`
--

CREATE TABLE `conciliacao` (
  `id` int(11) NOT NULL,
  `pagamento_id` int(11) DEFAULT NULL,
  `origem` varchar(60) NOT NULL,
  `referencia_externa` varchar(120) NOT NULL,
  `valor` decimal(15,2) NOT NULL,
  `data_evento` datetime NOT NULL,
  `status` enum('PENDENTE','CONCILIADO','DIVERGENTE') NOT NULL DEFAULT 'PENDENTE',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `condicoes_pagamento`
--

CREATE TABLE `condicoes_pagamento` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `tipo` enum('vista','parcelado','formula') DEFAULT 'parcelado',
  `qtd_parcelas` int(11) DEFAULT 1,
  `intervalo_dias` int(11) DEFAULT 30,
  `primeira_data` int(11) DEFAULT 0,
  `taxa_juros` decimal(5,2) DEFAULT 0.00,
  `entrada_obrigatoria` tinyint(1) DEFAULT 0,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `condicoes_pagamento`
--

INSERT INTO `condicoes_pagamento` (`id`, `nome`, `tipo`, `qtd_parcelas`, `intervalo_dias`, `primeira_data`, `taxa_juros`, `entrada_obrigatoria`, `ativo`, `created_at`) VALUES
(1, '?? Vista', 'vista', 1, 0, 0, 0.00, 0, 1, '2026-04-16 15:24:19'),
(2, '30 Dias', 'parcelado', 1, 30, 0, 0.00, 0, 1, '2026-04-16 15:24:19'),
(3, '30/60 Dias', 'parcelado', 2, 30, 0, 0.00, 0, 1, '2026-04-16 15:24:19'),
(4, '30/60/90 Dias', 'parcelado', 3, 30, 0, 0.00, 0, 1, '2026-04-16 15:24:19'),
(5, '30/60/90/120 Dias', 'parcelado', 4, 30, 0, 0.00, 0, 1, '2026-04-16 15:24:19');

-- --------------------------------------------------------

--
-- Estrutura para tabela `condicoes_parcelas`
--

CREATE TABLE `condicoes_parcelas` (
  `id` int(11) NOT NULL,
  `condicao_id` int(11) NOT NULL,
  `parcela` int(11) NOT NULL,
  `dias` int(11) NOT NULL,
  `percentual` decimal(5,2) NOT NULL,
  `data_fixa` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `condicoes_parcelas`
--

INSERT INTO `condicoes_parcelas` (`id`, `condicao_id`, `parcela`, `dias`, `percentual`, `data_fixa`) VALUES
(1, 1, 1, 0, 100.00, NULL),
(2, 2, 1, 30, 100.00, NULL),
(3, 3, 1, 0, 50.00, NULL),
(4, 3, 2, 30, 50.00, NULL),
(5, 4, 1, 0, 33.33, NULL),
(6, 4, 2, 30, 33.33, NULL),
(7, 4, 3, 60, 33.34, NULL),
(8, 5, 1, 0, 25.00, NULL),
(9, 5, 2, 30, 25.00, NULL),
(10, 5, 3, 60, 25.00, NULL),
(11, 5, 4, 90, 25.00, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `condicoes_restricoes`
--

CREATE TABLE `condicoes_restricoes` (
  `id` int(11) NOT NULL,
  `condicao_id` int(11) NOT NULL,
  `pessoa_id` int(11) NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contas_bancarias`
--

CREATE TABLE `contas_bancarias` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `banco` varchar(50) NOT NULL,
  `agencia` varchar(20) NOT NULL,
  `conta` varchar(30) NOT NULL,
  `tipo` enum('corrente','poupanca') DEFAULT 'corrente',
  `titular` varchar(200) DEFAULT NULL,
  `gerente_conta` varchar(100) DEFAULT NULL,
  `telefone_gerente` varchar(20) DEFAULT NULL,
  `saldo_inicial` decimal(15,2) DEFAULT 0.00,
  `data_saldo_inicial` date DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contas_pagar`
--

CREATE TABLE `contas_pagar` (
  `id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `fornecedor` varchar(150) DEFAULT NULL,
  `centro_custo_id` int(11) DEFAULT NULL,
  `valor` decimal(15,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `status` enum('PENDENTE','PAGO','ATRASADO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `contas_receber`
--

CREATE TABLE `contas_receber` (
  `id` int(11) NOT NULL,
  `venda_id` int(11) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `tipo_caixa_id` int(11) DEFAULT NULL,
  `parcela_numero` int(11) NOT NULL DEFAULT 1,
  `total_parcelas` int(11) NOT NULL DEFAULT 1,
  `valor_bruto` decimal(15,2) NOT NULL,
  `taxa_antecipacao_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `valor_liquido` decimal(15,2) NOT NULL,
  `valor_recebido` decimal(15,2) NOT NULL DEFAULT 0.00,
  `data_vencimento` date NOT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `forma_pagamento` varchar(50) NOT NULL,
  `status` enum('PENDENTE','PAGO','ATRASADO','CANCELADO') NOT NULL DEFAULT 'PENDENTE',
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `contas_receber`
--

INSERT INTO `contas_receber` (`id`, `venda_id`, `cliente_id`, `tipo_caixa_id`, `parcela_numero`, `total_parcelas`, `valor_bruto`, `taxa_antecipacao_percent`, `valor_liquido`, `valor_recebido`, `data_vencimento`, `data_pagamento`, `forma_pagamento`, `status`, `observacoes`, `created_at`, `updated_at`) VALUES
(1, 56, 36, 1, 1, 1, 3000.00, 0.00, 3000.00, 0.00, '2026-03-24', NULL, 'avista', 'CANCELADO', '\nCancelamento automático: tive que cancelar e criar outra pra entrar no fluxo ', '2026-03-24 22:26:11', '2026-04-06 08:39:44'),
(2, 58, 38, 3, 1, 10, 741.60, 0.00, 741.60, 741.60, '2026-04-22', '2026-03-30 05:57:02', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:02'),
(3, 58, 38, 3, 2, 10, 741.60, 0.00, 741.60, 741.60, '2026-05-22', '2026-03-30 05:57:06', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:06'),
(4, 58, 38, 3, 3, 10, 741.60, 0.00, 741.60, 741.60, '2026-06-21', '2026-03-30 05:57:11', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:11'),
(5, 58, 38, 3, 4, 10, 741.60, 0.00, 741.60, 741.60, '2026-07-21', '2026-03-30 05:57:14', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:14'),
(6, 58, 38, 3, 5, 10, 741.60, 0.00, 741.60, 741.60, '2026-08-20', '2026-03-30 05:57:18', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:18'),
(7, 58, 38, 3, 6, 10, 741.60, 0.00, 741.60, 741.60, '2026-09-19', '2026-03-30 05:57:21', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:21'),
(8, 58, 38, 3, 7, 10, 741.60, 0.00, 741.60, 741.60, '2026-10-19', '2026-03-30 05:57:30', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:30'),
(9, 58, 38, 3, 8, 10, 741.60, 0.00, 741.60, 741.60, '2026-11-18', '2026-03-30 05:57:43', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:43'),
(10, 58, 38, 3, 9, 10, 741.60, 0.00, 741.60, 741.60, '2026-12-18', '2026-03-30 05:57:47', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:47'),
(11, 58, 38, 3, 10, 10, 741.60, 0.00, 741.60, 741.60, '2027-01-17', '2026-03-30 05:57:53', 'cartao', 'PAGO', NULL, '2026-03-30 08:38:05', '2026-03-30 08:57:53');

-- --------------------------------------------------------

--
-- Estrutura para tabela `contatos`
--

CREATE TABLE `contatos` (
  `id` int(11) NOT NULL,
  `pessoa_id` int(11) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `cargo` varchar(100) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `principal` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas`
--

CREATE TABLE `empresas` (
  `id` int(11) NOT NULL,
  `razao_social` varchar(200) NOT NULL,
  `nome_fantasia` varchar(200) DEFAULT NULL,
  `cnpj` varchar(20) DEFAULT NULL,
  `inscricao_estadual` varchar(30) DEFAULT NULL,
  `inscricao_municipal` varchar(30) DEFAULT NULL,
  `telefone` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `site` varchar(100) DEFAULT NULL,
  `logotipo` varchar(255) DEFAULT NULL,
  `regime_tributario` enum('simples','presumido','real') DEFAULT 'simples',
  `cnae` varchar(10) DEFAULT NULL,
  `ibge_code` varchar(10) DEFAULT NULL,
  `config_fiscal` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config_fiscal`)),
  `config_nfe` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`config_nfe`)),
  `matriz_id` int(11) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `empresas`
--

INSERT INTO `empresas` (`id`, `razao_social`, `nome_fantasia`, `cnpj`, `inscricao_estadual`, `inscricao_municipal`, `telefone`, `email`, `site`, `logotipo`, `regime_tributario`, `cnae`, `ibge_code`, `config_fiscal`, `config_nfe`, `matriz_id`, `ativo`, `created_at`, `updated_at`) VALUES
(1, 'Sua Empresa Ltda', 'Sua Empresa', '00.000.000/0001-00', '0000000000', NULL, '(00) 0000-0000', 'contato@empresa.com', NULL, NULL, 'simples', NULL, NULL, NULL, NULL, NULL, 1, '2026-04-16 15:24:18', '2026-04-16 15:24:18');

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_enderecos`
--

CREATE TABLE `empresas_enderecos` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `tipo` enum('principal','filial','entrega','cobranca') DEFAULT 'principal',
  `logradouro` varchar(200) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `pais` varchar(50) DEFAULT 'Brasil',
  `principal` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `empresas_nfe_config`
--

CREATE TABLE `empresas_nfe_config` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `ambiente` varchar(10) NOT NULL,
  `serie_nfe` int(11) DEFAULT 1,
  `serie_nfce` int(11) DEFAULT 1,
  `certificado_pfx` varchar(255) DEFAULT NULL,
  `certificado_senha` varchar(100) DEFAULT NULL,
  `email_remetente` varchar(100) DEFAULT NULL,
  `sms_token` varchar(100) DEFAULT NULL,
  `webhook_nfe` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `estrutura_produto`
--

CREATE TABLE `estrutura_produto` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `versao` varchar(30) NOT NULL DEFAULT 'v1',
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `estrutura_produto`
--

INSERT INTO `estrutura_produto` (`id`, `produto_id`, `versao`, `observacoes`, `created_at`) VALUES
(1, 11, 'v1', NULL, '2026-03-28 16:36:56'),
(2, 12, 'v1', NULL, '2026-04-06 08:08:43'),
(3, 13, 'v1', NULL, '2026-04-06 08:18:53'),
(4, 14, 'v1', NULL, '2026-04-06 08:21:01'),
(5, 15, 'v1', NULL, '2026-04-15 12:03:43'),
(6, 17, 'v1', NULL, '2026-04-15 12:37:41'),
(7, 18, 'v1', NULL, '2026-04-15 12:45:14'),
(8, 20, 'v1', NULL, '2026-04-15 12:48:52'),
(9, 21, 'v1', NULL, '2026-04-15 12:54:17'),
(10, 22, 'v1', NULL, '2026-04-15 12:55:09'),
(11, 23, 'v1', NULL, '2026-04-15 12:57:57'),
(12, 24, 'v1', NULL, '2026-04-15 12:58:34');

-- --------------------------------------------------------

--
-- Estrutura para tabela `familias_produtos`
--

CREATE TABLE `familias_produtos` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `familias_produtos`
--

INSERT INTO `familias_produtos` (`id`, `grupo_id`, `nome`, `descricao`, `ativo`, `created_at`) VALUES
(1, 1, 'Padr??o', NULL, 1, '2026-04-16 15:24:18'),
(2, 2, 'Serie 1000', NULL, 1, '2026-04-16 15:24:18'),
(3, 2, 'Serie 2000', NULL, 1, '2026-04-16 15:24:18'),
(4, 3, 'Chapa', NULL, 1, '2026-04-16 15:24:18'),
(5, 3, 'Barra', NULL, 1, '2026-04-16 15:24:18');

-- --------------------------------------------------------

--
-- Estrutura para tabela `fluxo_caixa`
--

CREATE TABLE `fluxo_caixa` (
  `id` int(11) NOT NULL,
  `tipo` enum('ENTRADA','SAIDA') NOT NULL,
  `referencia_tipo` varchar(40) NOT NULL,
  `referencia_id` int(11) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `valor` decimal(15,2) NOT NULL,
  `data_movimento` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupos_permissoes`
--

CREATE TABLE `grupos_permissoes` (
  `id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `permissao_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `grupos_permissoes`
--

INSERT INTO `grupos_permissoes` (`id`, `grupo_id`, `permissao_id`, `created_at`) VALUES
(1647, 1, 1, '2026-04-16 17:49:38'),
(1648, 1, 2, '2026-04-16 17:49:38'),
(1649, 1, 3, '2026-04-16 17:49:38'),
(1650, 1, 4, '2026-04-16 17:49:38'),
(1651, 1, 5, '2026-04-16 17:49:38'),
(1652, 1, 6, '2026-04-16 17:49:38'),
(1653, 1, 7, '2026-04-16 17:49:38'),
(1654, 1, 8, '2026-04-16 17:49:38'),
(1655, 1, 9, '2026-04-16 17:49:38'),
(1656, 1, 10, '2026-04-16 17:49:38'),
(1657, 1, 11, '2026-04-16 17:49:38'),
(1658, 1, 12, '2026-04-16 17:49:38'),
(1659, 1, 13, '2026-04-16 17:49:38'),
(1660, 1, 14, '2026-04-16 17:49:38'),
(1661, 1, 15, '2026-04-16 17:49:38'),
(1662, 1, 16, '2026-04-16 17:49:38'),
(1663, 1, 17, '2026-04-16 17:49:38'),
(1664, 1, 18, '2026-04-16 17:49:38'),
(1665, 1, 19, '2026-04-16 17:49:38'),
(1666, 1, 20, '2026-04-16 17:49:38'),
(1667, 1, 21, '2026-04-16 17:49:38'),
(1668, 1, 22, '2026-04-16 17:49:38'),
(1669, 1, 23, '2026-04-16 17:49:38'),
(1670, 1, 24, '2026-04-16 17:49:38'),
(1671, 1, 25, '2026-04-16 17:49:38'),
(1672, 1, 26, '2026-04-16 17:49:38'),
(1673, 1, 27, '2026-04-16 17:49:38'),
(1674, 1, 28, '2026-04-16 17:49:38'),
(1675, 1, 29, '2026-04-16 17:49:38'),
(1676, 1, 30, '2026-04-16 17:49:38'),
(1677, 1, 31, '2026-04-16 17:49:38'),
(1678, 1, 32, '2026-04-16 17:49:38'),
(1679, 1, 33, '2026-04-16 17:49:38'),
(1680, 1, 34, '2026-04-16 17:49:38'),
(1681, 1, 35, '2026-04-16 17:49:38'),
(1682, 1, 36, '2026-04-16 17:49:38'),
(1683, 1, 37, '2026-04-16 17:49:38'),
(1684, 1, 38, '2026-04-16 17:49:38'),
(1685, 1, 39, '2026-04-16 17:49:38'),
(1686, 1, 40, '2026-04-16 17:49:38'),
(1687, 1, 41, '2026-04-16 17:49:38'),
(1688, 1, 74, '2026-04-16 17:49:38'),
(1689, 1, 75, '2026-04-16 17:49:38'),
(1690, 1, 76, '2026-04-16 17:49:38'),
(1691, 1, 77, '2026-04-16 17:49:38'),
(1692, 1, 78, '2026-04-16 17:49:38'),
(1693, 1, 79, '2026-04-16 17:49:38'),
(1694, 1, 80, '2026-04-16 17:49:38'),
(1695, 1, 81, '2026-04-16 17:49:38'),
(1696, 1, 184, '2026-04-16 17:49:38'),
(1697, 1, 185, '2026-04-16 17:49:38'),
(1698, 1, 186, '2026-04-16 17:49:38'),
(1699, 1, 187, '2026-04-16 17:49:38'),
(1700, 1, 200, '2026-04-16 17:49:38'),
(1701, 1, 201, '2026-04-16 17:49:38'),
(1702, 1, 202, '2026-04-16 17:49:38'),
(1703, 1, 203, '2026-04-16 17:49:38'),
(1704, 1, 204, '2026-04-16 17:49:38'),
(1705, 1, 205, '2026-04-16 17:49:38'),
(1706, 1, 206, '2026-04-16 17:49:38'),
(1707, 1, 207, '2026-04-16 17:49:38'),
(1708, 1, 115, '2026-04-16 17:49:38'),
(1709, 1, 116, '2026-04-16 17:49:38'),
(1710, 1, 117, '2026-04-16 17:49:38'),
(1711, 1, 118, '2026-04-16 17:49:38'),
(1712, 1, 119, '2026-04-16 17:49:38'),
(1713, 1, 52, '2026-04-16 17:49:38'),
(1714, 1, 53, '2026-04-16 17:49:38'),
(1715, 1, 54, '2026-04-16 17:49:38'),
(1716, 1, 55, '2026-04-16 17:49:38'),
(1717, 1, 56, '2026-04-16 17:49:38'),
(1718, 1, 57, '2026-04-16 17:49:38'),
(1719, 1, 58, '2026-04-16 17:49:38'),
(1720, 1, 59, '2026-04-16 17:49:38'),
(1721, 1, 60, '2026-04-16 17:49:38'),
(1722, 1, 61, '2026-04-16 17:49:38'),
(1723, 1, 62, '2026-04-16 17:49:38'),
(1724, 1, 82, '2026-04-16 17:49:38'),
(1725, 1, 83, '2026-04-16 17:49:38'),
(1726, 1, 84, '2026-04-16 17:49:38'),
(1727, 1, 85, '2026-04-16 17:49:38'),
(1728, 1, 86, '2026-04-16 17:49:38'),
(1729, 1, 87, '2026-04-16 17:49:38'),
(1730, 1, 88, '2026-04-16 17:49:38'),
(1731, 1, 89, '2026-04-16 17:49:38'),
(1732, 1, 90, '2026-04-16 17:49:38'),
(1733, 1, 91, '2026-04-16 17:49:38'),
(1734, 1, 92, '2026-04-16 17:49:38'),
(1735, 1, 93, '2026-04-16 17:49:38'),
(1736, 1, 94, '2026-04-16 17:49:38'),
(1737, 1, 95, '2026-04-16 17:49:38'),
(1738, 1, 96, '2026-04-16 17:49:38'),
(1739, 1, 97, '2026-04-16 17:49:38'),
(1740, 1, 98, '2026-04-16 17:49:38'),
(1741, 1, 99, '2026-04-16 17:49:38'),
(1742, 1, 100, '2026-04-16 17:49:38'),
(1743, 1, 101, '2026-04-16 17:49:38'),
(1744, 1, 102, '2026-04-16 17:49:38'),
(1745, 1, 103, '2026-04-16 17:49:38'),
(1746, 1, 104, '2026-04-16 17:49:38'),
(1747, 1, 105, '2026-04-16 17:49:38'),
(1748, 1, 106, '2026-04-16 17:49:38'),
(1749, 1, 107, '2026-04-16 17:49:38'),
(1750, 1, 63, '2026-04-16 17:49:38'),
(1751, 1, 64, '2026-04-16 17:49:38'),
(1752, 1, 65, '2026-04-16 17:49:38'),
(1753, 1, 66, '2026-04-16 17:49:38'),
(1754, 1, 67, '2026-04-16 17:49:38'),
(1755, 1, 68, '2026-04-16 17:49:38'),
(1756, 1, 69, '2026-04-16 17:49:38'),
(1757, 1, 112, '2026-04-16 17:49:38'),
(1758, 1, 113, '2026-04-16 17:49:38'),
(1759, 1, 114, '2026-04-16 17:49:38'),
(1760, 1, 229, '2026-04-16 17:49:38'),
(1761, 1, 230, '2026-04-16 17:49:38'),
(1762, 1, 70, '2026-04-16 17:49:38'),
(1763, 1, 71, '2026-04-16 17:49:38'),
(1764, 1, 72, '2026-04-16 17:49:38'),
(1765, 1, 73, '2026-04-16 17:49:38'),
(1766, 1, 120, '2026-04-16 17:49:38'),
(1767, 1, 235, '2026-04-16 17:49:38'),
(1768, 1, 42, '2026-04-16 17:49:38'),
(1769, 1, 43, '2026-04-16 17:49:38'),
(1770, 1, 44, '2026-04-16 17:49:38'),
(1771, 1, 45, '2026-04-16 17:49:38'),
(1772, 1, 46, '2026-04-16 17:49:38'),
(1773, 1, 47, '2026-04-16 17:49:38'),
(1774, 1, 48, '2026-04-16 17:49:38'),
(1775, 1, 49, '2026-04-16 17:49:38'),
(1776, 1, 50, '2026-04-16 17:49:38'),
(1777, 1, 51, '2026-04-16 17:49:38'),
(1778, 1, 108, '2026-04-16 17:49:38'),
(1779, 1, 109, '2026-04-16 17:49:38'),
(1780, 1, 110, '2026-04-16 17:49:38'),
(1781, 1, 111, '2026-04-16 17:49:38'),
(1782, 2, 10, '2026-04-16 17:49:38'),
(1783, 2, 11, '2026-04-16 17:49:38'),
(1784, 2, 12, '2026-04-16 17:49:38'),
(1785, 2, 13, '2026-04-16 17:49:38'),
(1786, 2, 14, '2026-04-16 17:49:38'),
(1787, 2, 15, '2026-04-16 17:49:38'),
(1788, 2, 16, '2026-04-16 17:49:38'),
(1789, 2, 17, '2026-04-16 17:49:38'),
(1790, 2, 18, '2026-04-16 17:49:38'),
(1791, 2, 19, '2026-04-16 17:49:38'),
(1792, 2, 20, '2026-04-16 17:49:38'),
(1793, 2, 21, '2026-04-16 17:49:38'),
(1794, 2, 22, '2026-04-16 17:49:38'),
(1795, 2, 23, '2026-04-16 17:49:38'),
(1796, 2, 24, '2026-04-16 17:49:38'),
(1797, 2, 25, '2026-04-16 17:49:38'),
(1798, 2, 184, '2026-04-16 17:49:38'),
(1799, 2, 185, '2026-04-16 17:49:38'),
(1800, 2, 186, '2026-04-16 17:49:38'),
(1801, 2, 187, '2026-04-16 17:49:38'),
(1802, 2, 30, '2026-04-16 17:49:38'),
(1803, 2, 31, '2026-04-16 17:49:38'),
(1804, 2, 32, '2026-04-16 17:49:38'),
(1805, 2, 33, '2026-04-16 17:49:38'),
(1806, 2, 34, '2026-04-16 17:49:38'),
(1807, 2, 35, '2026-04-16 17:49:38'),
(1808, 2, 36, '2026-04-16 17:49:38'),
(1809, 2, 37, '2026-04-16 17:49:38'),
(1810, 2, 26, '2026-04-16 17:49:38'),
(1811, 2, 27, '2026-04-16 17:49:38'),
(1812, 2, 28, '2026-04-16 17:49:38'),
(1813, 2, 29, '2026-04-16 17:49:38'),
(1814, 2, 200, '2026-04-16 17:49:38'),
(1815, 2, 201, '2026-04-16 17:49:38'),
(1816, 2, 202, '2026-04-16 17:49:38'),
(1817, 2, 203, '2026-04-16 17:49:38'),
(1818, 2, 204, '2026-04-16 17:49:38'),
(1819, 2, 205, '2026-04-16 17:49:38'),
(1820, 2, 206, '2026-04-16 17:49:38'),
(1821, 2, 207, '2026-04-16 17:49:38'),
(1822, 2, 47, '2026-04-16 17:49:38'),
(1823, 2, 48, '2026-04-16 17:49:38'),
(1824, 2, 49, '2026-04-16 17:49:38'),
(1825, 2, 50, '2026-04-16 17:49:38'),
(1826, 2, 42, '2026-04-16 17:49:38'),
(1827, 2, 43, '2026-04-16 17:49:38'),
(1828, 2, 44, '2026-04-16 17:49:38'),
(1829, 2, 45, '2026-04-16 17:49:38'),
(1830, 2, 52, '2026-04-16 17:49:38'),
(1831, 2, 53, '2026-04-16 17:49:38'),
(1832, 2, 54, '2026-04-16 17:49:38'),
(1833, 2, 56, '2026-04-16 17:49:38'),
(1834, 2, 57, '2026-04-16 17:49:38'),
(1835, 2, 58, '2026-04-16 17:49:38'),
(1836, 2, 60, '2026-04-16 17:49:38'),
(1837, 2, 63, '2026-04-16 17:49:38'),
(1838, 2, 64, '2026-04-16 17:49:38'),
(1839, 2, 65, '2026-04-16 17:49:38'),
(1840, 2, 229, '2026-04-16 17:49:38'),
(1841, 2, 230, '2026-04-16 17:49:38'),
(1842, 2, 115, '2026-04-16 17:49:38'),
(1843, 2, 116, '2026-04-16 17:49:38'),
(1844, 2, 117, '2026-04-16 17:49:38'),
(1845, 2, 118, '2026-04-16 17:49:38'),
(1846, 2, 235, '2026-04-16 17:49:38'),
(1847, 3, 10, '2026-04-16 17:49:38'),
(1848, 3, 11, '2026-04-16 17:49:38'),
(1849, 3, 12, '2026-04-16 17:49:38'),
(1850, 3, 14, '2026-04-16 17:49:38'),
(1851, 3, 15, '2026-04-16 17:49:38'),
(1852, 3, 16, '2026-04-16 17:49:38'),
(1853, 3, 47, '2026-04-16 17:49:38'),
(1854, 3, 48, '2026-04-16 17:49:38'),
(1855, 3, 49, '2026-04-16 17:49:38'),
(1856, 3, 42, '2026-04-16 17:49:38'),
(1857, 3, 43, '2026-04-16 17:49:38'),
(1858, 3, 44, '2026-04-16 17:49:38'),
(1859, 3, 45, '2026-04-16 17:49:38'),
(1860, 3, 63, '2026-04-16 17:49:38'),
(1861, 3, 230, '2026-04-16 17:49:38'),
(1862, 3, 235, '2026-04-16 17:49:38'),
(1863, 4, 10, '2026-04-16 17:49:38'),
(1864, 4, 14, '2026-04-16 17:49:38'),
(1865, 4, 15, '2026-04-16 17:49:38'),
(1866, 4, 16, '2026-04-16 17:49:38'),
(1867, 4, 17, '2026-04-16 17:49:38'),
(1868, 4, 42, '2026-04-16 17:49:38'),
(1869, 4, 43, '2026-04-16 17:49:38'),
(1870, 4, 44, '2026-04-16 17:49:38'),
(1871, 4, 45, '2026-04-16 17:49:38'),
(1872, 4, 63, '2026-04-16 17:49:38'),
(1873, 4, 64, '2026-04-16 17:49:38'),
(1874, 4, 65, '2026-04-16 17:49:38'),
(1875, 4, 115, '2026-04-16 17:49:38'),
(1876, 4, 116, '2026-04-16 17:49:38'),
(1877, 4, 117, '2026-04-16 17:49:38'),
(1878, 4, 118, '2026-04-16 17:49:38'),
(1879, 4, 235, '2026-04-16 17:49:38'),
(1880, 5, 63, '2026-04-16 17:49:38'),
(1881, 5, 229, '2026-04-16 17:49:38'),
(1882, 5, 230, '2026-04-16 17:49:38');

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupos_produtos`
--

CREATE TABLE `grupos_produtos` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) DEFAULT NULL,
  `setor_id` int(11) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `grupos_produtos`
--

INSERT INTO `grupos_produtos` (`id`, `empresa_id`, `setor_id`, `nome`, `descricao`, `ativo`, `created_at`) VALUES
(1, 1, NULL, 'Geral', NULL, 1, '2026-04-16 15:24:18'),
(2, 1, NULL, 'Inox', NULL, 1, '2026-04-16 15:24:18'),
(3, 1, NULL, 'A??o Carbono', NULL, 1, '2026-04-16 15:24:18'),
(4, NULL, NULL, 'Geral', NULL, 1, '2026-04-16 15:24:18'),
(5, NULL, NULL, 'Inox', NULL, 1, '2026-04-16 15:24:18'),
(6, NULL, NULL, 'A??o Carbono', NULL, 1, '2026-04-16 15:24:18');

-- --------------------------------------------------------

--
-- Estrutura para tabela `grupos_usuarios`
--

CREATE TABLE `grupos_usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(80) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `super_admin` tinyint(1) NOT NULL DEFAULT 0,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `grupos_usuarios`
--

INSERT INTO `grupos_usuarios` (`id`, `nome`, `descricao`, `super_admin`, `ativo`, `created_at`, `updated_at`) VALUES
(1, 'Administrador', 'Acesso total ao sistema', 1, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(2, 'Gerente', 'Acesso gerencial completo', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(3, 'Vendedor', 'Acesso a vendas e or??amentos', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(4, 'Projetista', 'Acesso a projetos e engenharia', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(5, 'Produ????o', 'Acesso ao painel de produ????o', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(6, 'Financeiro', 'Acesso ao m??dulo financeiro', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15'),
(7, 'Estoque', 'Acesso ao controle de estoque', 0, 1, '2026-04-16 15:24:15', '2026-04-16 15:24:15');

-- --------------------------------------------------------

--
-- Estrutura para tabela `insumos`
--

CREATE TABLE `insumos` (
  `id` int(11) NOT NULL,
  `codigo` varchar(60) DEFAULT NULL,
  `nome` varchar(180) NOT NULL,
  `fornecedor` varchar(180) DEFAULT NULL,
  `unidade` varchar(20) NOT NULL DEFAULT 'un',
  `custo_unitario` decimal(15,4) NOT NULL DEFAULT 0.0000,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `insumos`
--

INSERT INTO `insumos` (`id`, `codigo`, `nome`, `fornecedor`, `unidade`, `custo_unitario`, `observacoes`, `created_at`, `updated_at`) VALUES
(1, NULL, 'Resistëncia', 'IMC', 'un', 80.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(2, NULL, 'Chapa inox', 'Multinox', 'kg', 21.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(3, NULL, 'Chave 30a Botáo liga/desliga', 'Alibaba', 'un', 16.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(4, NULL, 'Controlador STC1000', 'Mercado livre', 'un', 39.9000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(5, NULL, 'Manta fibra vidro', 'Isoferes', 'un', 75.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(6, NULL, 'Manta lá de rocha', 'Mercado livre', 'un', 65.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(7, NULL, 'terminais', 'Mercado livre', 'un', 5.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(8, NULL, 'Tomada Prensada 20A', 'Mercado livre', 'un', 32.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(9, NULL, 'Adesivo Resinado', NULL, 'un', 45.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(10, NULL, 'Cubas Gns 1/3x100', 'Mercado livre', 'un', 270.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(11, NULL, 'Parafuso inox', NULL, 'un', 6.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(12, NULL, 'Parafuso comum', NULL, 'un', 8.0000, NULL, '2026-04-06 08:17:38', '2026-04-06 08:17:38'),
(13, NULL, 'Resistencia 800w', NULL, 'un', 0.0000, NULL, '2026-04-15 11:57:09', '2026-04-15 11:57:09');

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_alteracoes`
--

CREATE TABLE `logs_alteracoes` (
  `id` int(11) NOT NULL,
  `tipo_entidade` enum('venda','os') NOT NULL,
  `entidade_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `campo_alterado` varchar(100) NOT NULL,
  `valor_anterior` text DEFAULT NULL,
  `valor_novo` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `logs_alteracoes`
--

INSERT INTO `logs_alteracoes` (`id`, `tipo_entidade`, `entidade_id`, `usuario_id`, `campo_alterado`, `valor_anterior`, `valor_novo`, `created_at`) VALUES
(3, 'os', 41, 18, 'data_termino', '2026-03-20', '2026-04-03', '2026-03-05 14:15:02');

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_exclusao_vendas`
--

CREATE TABLE `logs_exclusao_vendas` (
  `id` int(11) NOT NULL,
  `venda_numero` varchar(20) NOT NULL,
  `venda_dados_json` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `motivo` text NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_retorno_etapa`
--

CREATE TABLE `logs_retorno_etapa` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `etapa_anterior` varchar(50) NOT NULL,
  `etapa_retornada` varchar(50) NOT NULL,
  `justificativa` text NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `logs_retorno_etapa`
--

INSERT INTO `logs_retorno_etapa` (`id`, `os_id`, `etapa_anterior`, `etapa_retornada`, `justificativa`, `usuario_id`, `created_at`) VALUES
(11, 55, 'dobra', 'solda', 'Retorno sem finslizar', 9, '2026-03-30 12:08:14'),
(12, 73, 'dobra', 'solda', 'Ainda não chegou pra dobrar', 9, '2026-04-10 10:54:36');

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_senha`
--

CREATE TABLE `logs_senha` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo_alteracao` enum('troca_propria','reset_admin','expiracao') NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `logs_sistema`
--

CREATE TABLE `logs_sistema` (
  `id` int(11) NOT NULL,
  `entidade` varchar(50) NOT NULL,
  `entidade_id` int(11) NOT NULL,
  `acao` varchar(50) NOT NULL,
  `detalhe` text DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `logs_sistema`
--

INSERT INTO `logs_sistema` (`id`, `entidade`, `entidade_id`, `acao`, `detalhe`, `usuario_id`, `created_at`) VALUES
(1, 'venda', 56, 'gerar_contas_receber', 'Geradas 1 movimentação(ões) financeiras para o caixa Dinheiro.', 18, '2026-03-24 22:26:11'),
(2, 'venda', 56, 'faturar', 'Venda faturada e financeiro gerado.', 18, '2026-03-24 22:26:11'),
(3, 'venda', 43, 'cancelar_contas', '\nCancelamento automático: Cliente cancelou a compra', 18, '2026-03-26 09:13:36'),
(4, 'venda', 52, 'cancelar_contas', '\nCancelamento automático: Teste', 18, '2026-03-26 09:14:28'),
(5, 'venda', 44, 'cancelar_contas', '\nCancelamento automático: teste', 18, '2026-03-28 12:32:48'),
(6, 'venda', 58, 'gerar_contas_receber', 'Geradas 10 movimentação(ões) financeiras para o caixa Cartao de Credito.', 18, '2026-03-30 08:38:05'),
(7, 'venda', 58, 'faturar', 'Venda faturada e financeiro gerado.', 18, '2026-03-30 08:38:05'),
(8, 'venda', 63, 'cancelar_contas', '\nCancelamento automático: lançado sem data de termino ', 4, '2026-03-31 13:36:38'),
(9, 'venda', 63, 'cancelar_contas', '\nCancelamento automático: lançada sem data de termino ', 4, '2026-03-31 13:37:06'),
(10, 'venda', 62, 'cancelar_contas', '\nCancelamento automático: executado', 18, '2026-04-06 08:38:38'),
(11, 'venda', 61, 'cancelar_contas', '\nCancelamento automático: executado', 18, '2026-04-06 08:38:43'),
(12, 'venda', 56, 'cancelar_contas', '\nCancelamento automático: tive que cancelar e criar outra pra entrar no fluxo ', 18, '2026-04-06 08:39:44'),
(13, 'venda', 42, 'cancelar_contas', '\nCancelamento automático: Venda já entregue', 18, '2026-04-06 08:46:51'),
(14, 'venda', 39, 'cancelar_contas', '\nCancelamento automático: Venda já entregue', 18, '2026-04-06 08:47:02'),
(15, 'venda', 79, 'cancelar_contas', '\nCancelamento automático: Falta de foto da mesa.', 6, '2026-04-15 11:39:50');

-- --------------------------------------------------------

--
-- Estrutura para tabela `naturezas_operacao`
--

CREATE TABLE `naturezas_operacao` (
  `id` int(11) NOT NULL,
  `cfop` varchar(10) NOT NULL,
  `descricao` varchar(200) NOT NULL,
  `tipo_operacao` enum('interestadual','interna') DEFAULT 'interna',
  `tipo_movimento` varchar(20) DEFAULT 'saida',
  `financeiro` tinyint(1) DEFAULT 0,
  `observacoes` text DEFAULT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `naturezas_operacao`
--

INSERT INTO `naturezas_operacao` (`id`, `cfop`, `descricao`, `tipo_operacao`, `tipo_movimento`, `financeiro`, `observacoes`, `ativo`, `created_at`) VALUES
(1, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:24:20'),
(2, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:24:20'),
(3, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:24:20'),
(4, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:24:20'),
(5, '5205', 'Presta????o de servi??o', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:24:20'),
(6, '1201', 'Devolu????o de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:24:20'),
(7, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:24:20'),
(8, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:25:41'),
(9, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:25:41'),
(10, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:25:41'),
(11, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:25:41'),
(12, '5205', 'Presta????o de servi??o', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:25:41'),
(13, '1201', 'Devolu????o de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:25:41'),
(14, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:25:41'),
(15, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:27:48'),
(16, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:27:48'),
(17, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:27:48'),
(18, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:27:48'),
(19, '5205', 'Presta????????o de servi????o', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:27:48'),
(20, '1201', 'Devolu????????o de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:27:48'),
(21, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:27:48'),
(22, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:28:56'),
(23, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:28:56'),
(24, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:28:56'),
(25, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:28:56'),
(26, '5205', 'Presta????????o de servi????o', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:28:56'),
(27, '1201', 'Devolu????????o de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:28:56'),
(28, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:28:56'),
(29, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:30:17'),
(30, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:30:17'),
(31, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:30:17'),
(32, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:30:17'),
(33, '5205', 'Presta????????o de servi????o', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:30:17'),
(34, '1201', 'Devolu????????o de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:30:17'),
(35, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:30:17'),
(36, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:33:36'),
(37, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:33:36'),
(38, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:33:36'),
(39, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:33:36'),
(40, '5205', 'Prestação de serviço', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:33:36'),
(41, '1201', 'Devolução de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:33:36'),
(42, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:33:36'),
(43, '5101', 'Venda de mercadoria', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:35:00'),
(44, '5102', 'Venda de mercadoria - STF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:35:00'),
(45, '6101', 'Venda de mercadoria - CF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:35:00'),
(46, '6102', 'Venda de mercadoria - UF', 'interestadual', 'saida', 0, NULL, 1, '2026-04-16 15:35:00'),
(47, '5205', 'Prestação de serviço', 'interna', 'saida', 0, NULL, 1, '2026-04-16 15:35:00'),
(48, '1201', 'Devolução de venda', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:35:00'),
(49, '2201', 'Compra de mercadoria', 'interna', 'entrada', 0, NULL, 1, '2026-04-16 15:35:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes`
--

CREATE TABLE `notificacoes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL,
  `titulo` varchar(120) NOT NULL,
  `mensagem` text NOT NULL,
  `lida` tinyint(1) NOT NULL DEFAULT 0,
  `chave_evento` varchar(120) DEFAULT NULL,
  `referencia_tipo` varchar(40) DEFAULT NULL,
  `referencia_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `notificacoes`
--

INSERT INTO `notificacoes` (`id`, `usuario_id`, `tipo`, `titulo`, `mensagem`, `lida`, `chave_evento`, `referencia_tipo`, `referencia_id`, `created_at`) VALUES
(1, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_39_20260324', 'os', 39, '2026-03-24 21:44:22'),
(2, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_39_20260324', 'os', 39, '2026-03-24 21:44:22'),
(4, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_39_20260324', 'os', 39, '2026-03-24 21:44:22'),
(5, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 4 dia(s).', 1, 'os_atrasada_39_20260324', 'os', 39, '2026-03-24 21:44:22'),
(6, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 1 dia(s).', 0, 'os_atrasada_40_20260324', 'os', 40, '2026-03-24 21:44:22'),
(7, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 1 dia(s).', 0, 'os_atrasada_40_20260324', 'os', 40, '2026-03-24 21:44:22'),
(9, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 1 dia(s).', 0, 'os_atrasada_40_20260324', 'os', 40, '2026-03-24 21:44:22'),
(10, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 1 dia(s).', 1, 'os_atrasada_40_20260324', 'os', 40, '2026-03-24 21:44:22'),
(11, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 4 dia(s).', 0, 'os_atrasada_44_20260324', 'os', 44, '2026-03-24 21:44:22'),
(12, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 4 dia(s).', 0, 'os_atrasada_44_20260324', 'os', 44, '2026-03-24 21:44:22'),
(14, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 4 dia(s).', 0, 'os_atrasada_44_20260324', 'os', 44, '2026-03-24 21:44:22'),
(15, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 4 dia(s).', 1, 'os_atrasada_44_20260324', 'os', 44, '2026-03-24 21:44:22'),
(16, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 8 dia(s).', 0, 'os_atrasada_45_20260324', 'os', 45, '2026-03-24 21:44:22'),
(17, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 8 dia(s).', 0, 'os_atrasada_45_20260324', 'os', 45, '2026-03-24 21:44:22'),
(19, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 8 dia(s).', 0, 'os_atrasada_45_20260324', 'os', 45, '2026-03-24 21:44:22'),
(20, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 8 dia(s).', 1, 'os_atrasada_45_20260324', 'os', 45, '2026-03-24 21:44:22'),
(21, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 11 dia(s).', 0, 'os_atrasada_46_20260324', 'os', 46, '2026-03-24 21:44:22'),
(22, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 11 dia(s).', 0, 'os_atrasada_46_20260324', 'os', 46, '2026-03-24 21:44:22'),
(24, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 11 dia(s).', 0, 'os_atrasada_46_20260324', 'os', 46, '2026-03-24 21:44:22'),
(25, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 11 dia(s).', 1, 'os_atrasada_46_20260324', 'os', 46, '2026-03-24 21:44:22'),
(26, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 11 dia(s).', 0, 'os_atrasada_49_20260324', 'os', 49, '2026-03-24 21:44:22'),
(27, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 11 dia(s).', 0, 'os_atrasada_49_20260324', 'os', 49, '2026-03-24 21:44:22'),
(29, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 11 dia(s).', 0, 'os_atrasada_49_20260324', 'os', 49, '2026-03-24 21:44:22'),
(30, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 11 dia(s).', 1, 'os_atrasada_49_20260324', 'os', 49, '2026-03-24 21:44:22'),
(31, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260324', 'os', 44, '2026-03-24 21:44:22'),
(32, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260324', 'os', 44, '2026-03-24 21:44:23'),
(33, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260324', 'os', 44, '2026-03-24 21:44:23'),
(34, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260324', 'os', 44, '2026-03-24 21:44:23'),
(35, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260324', 'os', 44, '2026-03-24 21:44:23'),
(36, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260324', 'os', 45, '2026-03-24 21:44:23'),
(37, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260324', 'os', 45, '2026-03-24 21:44:23'),
(38, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260324', 'os', 45, '2026-03-24 21:44:23'),
(39, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260324', 'os', 45, '2026-03-24 21:44:23'),
(40, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260324', 'os', 45, '2026-03-24 21:44:23'),
(41, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260324', 'os', 46, '2026-03-24 21:44:23'),
(42, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260324', 'os', 46, '2026-03-24 21:44:23'),
(43, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260324', 'os', 46, '2026-03-24 21:44:23'),
(44, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260324', 'os', 46, '2026-03-24 21:44:23'),
(45, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260324', 'os', 46, '2026-03-24 21:44:23'),
(46, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260324', 'os', 47, '2026-03-24 21:44:23'),
(47, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260324', 'os', 47, '2026-03-24 21:44:23'),
(48, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260324', 'os', 47, '2026-03-24 21:44:23'),
(49, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260324', 'os', 47, '2026-03-24 21:44:23'),
(50, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260324', 'os', 47, '2026-03-24 21:44:23'),
(51, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260324', 'os', 48, '2026-03-24 21:44:23'),
(52, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260324', 'os', 48, '2026-03-24 21:44:23'),
(53, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260324', 'os', 48, '2026-03-24 21:44:23'),
(54, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260324', 'os', 48, '2026-03-24 21:44:23'),
(55, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260324', 'os', 48, '2026-03-24 21:44:23'),
(56, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260324', 'os', 50, '2026-03-24 21:44:23'),
(57, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260324', 'os', 50, '2026-03-24 21:44:23'),
(58, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_50_20260324', 'os', 50, '2026-03-24 21:44:23'),
(59, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260324', 'os', 50, '2026-03-24 21:44:23'),
(60, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_50_20260324', 'os', 50, '2026-03-24 21:44:23'),
(61, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_39_20260325', 'os', 39, '2026-03-25 15:25:02'),
(62, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_39_20260325', 'os', 39, '2026-03-25 15:25:02'),
(64, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_39_20260325', 'os', 39, '2026-03-25 15:25:02'),
(65, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 5 dia(s).', 1, 'os_atrasada_39_20260325', 'os', 39, '2026-03-25 15:25:02'),
(66, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 2 dia(s).', 0, 'os_atrasada_40_20260325', 'os', 40, '2026-03-25 15:25:02'),
(67, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 2 dia(s).', 0, 'os_atrasada_40_20260325', 'os', 40, '2026-03-25 15:25:02'),
(69, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 2 dia(s).', 0, 'os_atrasada_40_20260325', 'os', 40, '2026-03-25 15:25:02'),
(70, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 2 dia(s).', 1, 'os_atrasada_40_20260325', 'os', 40, '2026-03-25 15:25:02'),
(71, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 5 dia(s).', 0, 'os_atrasada_44_20260325', 'os', 44, '2026-03-25 15:25:02'),
(72, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 5 dia(s).', 0, 'os_atrasada_44_20260325', 'os', 44, '2026-03-25 15:25:02'),
(74, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 5 dia(s).', 0, 'os_atrasada_44_20260325', 'os', 44, '2026-03-25 15:25:02'),
(75, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 5 dia(s).', 1, 'os_atrasada_44_20260325', 'os', 44, '2026-03-25 15:25:02'),
(76, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 9 dia(s).', 0, 'os_atrasada_45_20260325', 'os', 45, '2026-03-25 15:25:02'),
(77, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 9 dia(s).', 0, 'os_atrasada_45_20260325', 'os', 45, '2026-03-25 15:25:02'),
(79, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 9 dia(s).', 0, 'os_atrasada_45_20260325', 'os', 45, '2026-03-25 15:25:02'),
(80, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 9 dia(s).', 1, 'os_atrasada_45_20260325', 'os', 45, '2026-03-25 15:25:02'),
(81, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 12 dia(s).', 0, 'os_atrasada_46_20260325', 'os', 46, '2026-03-25 15:25:02'),
(82, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 12 dia(s).', 0, 'os_atrasada_46_20260325', 'os', 46, '2026-03-25 15:25:02'),
(84, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 12 dia(s).', 0, 'os_atrasada_46_20260325', 'os', 46, '2026-03-25 15:25:02'),
(85, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 12 dia(s).', 1, 'os_atrasada_46_20260325', 'os', 46, '2026-03-25 15:25:02'),
(86, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 12 dia(s).', 0, 'os_atrasada_49_20260325', 'os', 49, '2026-03-25 15:25:02'),
(87, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 12 dia(s).', 0, 'os_atrasada_49_20260325', 'os', 49, '2026-03-25 15:25:03'),
(89, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 12 dia(s).', 0, 'os_atrasada_49_20260325', 'os', 49, '2026-03-25 15:25:03'),
(90, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 12 dia(s).', 1, 'os_atrasada_49_20260325', 'os', 49, '2026-03-25 15:25:03'),
(91, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260325', 'os', 44, '2026-03-25 15:25:03'),
(92, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260325', 'os', 44, '2026-03-25 15:25:03'),
(93, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260325', 'os', 44, '2026-03-25 15:25:03'),
(94, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260325', 'os', 44, '2026-03-25 15:25:03'),
(95, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260325', 'os', 44, '2026-03-25 15:25:03'),
(96, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260325', 'os', 45, '2026-03-25 15:25:03'),
(97, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260325', 'os', 45, '2026-03-25 15:25:03'),
(98, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260325', 'os', 45, '2026-03-25 15:25:03'),
(99, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260325', 'os', 45, '2026-03-25 15:25:03'),
(100, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260325', 'os', 45, '2026-03-25 15:25:03'),
(101, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260325', 'os', 46, '2026-03-25 15:25:03'),
(102, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260325', 'os', 46, '2026-03-25 15:25:03'),
(103, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260325', 'os', 46, '2026-03-25 15:25:03'),
(104, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260325', 'os', 46, '2026-03-25 15:25:03'),
(105, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260325', 'os', 46, '2026-03-25 15:25:03'),
(106, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260325', 'os', 47, '2026-03-25 15:25:03'),
(107, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260325', 'os', 47, '2026-03-25 15:25:03'),
(108, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260325', 'os', 47, '2026-03-25 15:25:03'),
(109, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260325', 'os', 47, '2026-03-25 15:25:03'),
(110, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260325', 'os', 47, '2026-03-25 15:25:03'),
(111, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260325', 'os', 48, '2026-03-25 15:25:03'),
(112, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260325', 'os', 48, '2026-03-25 15:25:03'),
(113, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260325', 'os', 48, '2026-03-25 15:25:03'),
(114, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260325', 'os', 48, '2026-03-25 15:25:03'),
(115, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260325', 'os', 48, '2026-03-25 15:25:03'),
(116, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260325', 'os', 50, '2026-03-25 15:25:03'),
(117, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260325', 'os', 50, '2026-03-25 15:25:03'),
(118, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_50_20260325', 'os', 50, '2026-03-25 15:25:03'),
(119, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_50_20260325', 'os', 50, '2026-03-25 15:25:03'),
(120, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0012 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_50_20260325', 'os', 50, '2026-03-25 15:25:03'),
(121, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260325', 'os', 54, '2026-03-25 15:25:03'),
(122, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260325', 'os', 54, '2026-03-25 15:25:03'),
(123, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260325', 'os', 54, '2026-03-25 15:25:03'),
(124, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260325', 'os', 54, '2026-03-25 15:25:03'),
(125, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260325', 'os', 54, '2026-03-25 15:25:03'),
(126, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260325', 'os', 55, '2026-03-25 15:25:03'),
(127, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260325', 'os', 55, '2026-03-25 15:25:03'),
(128, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_55_20260325', 'os', 55, '2026-03-25 15:25:03'),
(129, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260325', 'os', 55, '2026-03-25 15:25:03'),
(130, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_55_20260325', 'os', 55, '2026-03-25 15:25:03'),
(131, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260325', 'os', 56, '2026-03-25 15:25:03'),
(132, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260325', 'os', 56, '2026-03-25 15:25:03'),
(133, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260325', 'os', 56, '2026-03-25 15:25:03'),
(134, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260325', 'os', 56, '2026-03-25 15:25:03'),
(135, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260325', 'os', 56, '2026-03-25 15:25:03'),
(136, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260325', 'conta_receber', 1, '2026-03-25 15:25:03'),
(137, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260325', 'conta_receber', 1, '2026-03-25 15:25:03'),
(138, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260325', 'conta_receber', 1, '2026-03-25 15:25:03'),
(139, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260325', 'conta_receber', 1, '2026-03-25 15:25:03'),
(140, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260325', 'conta_receber', 1, '2026-03-25 15:25:03'),
(301, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 7 dia(s).', 0, 'os_atrasada_39_20260327', 'os', 39, '2026-03-27 13:39:27'),
(302, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 7 dia(s).', 0, 'os_atrasada_39_20260327', 'os', 39, '2026-03-27 13:39:27'),
(304, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 7 dia(s).', 0, 'os_atrasada_39_20260327', 'os', 39, '2026-03-27 13:39:27'),
(305, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 7 dia(s).', 1, 'os_atrasada_39_20260327', 'os', 39, '2026-03-27 13:39:27'),
(306, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 4 dia(s).', 0, 'os_atrasada_40_20260327', 'os', 40, '2026-03-27 13:39:27'),
(307, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 4 dia(s).', 0, 'os_atrasada_40_20260327', 'os', 40, '2026-03-27 13:39:27'),
(309, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 4 dia(s).', 0, 'os_atrasada_40_20260327', 'os', 40, '2026-03-27 13:39:27'),
(310, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 4 dia(s).', 1, 'os_atrasada_40_20260327', 'os', 40, '2026-03-27 13:39:27'),
(311, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_42_20260327', 'os', 42, '2026-03-27 13:39:27'),
(312, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_42_20260327', 'os', 42, '2026-03-27 13:39:27'),
(314, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_42_20260327', 'os', 42, '2026-03-27 13:39:27'),
(315, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 1 dia(s).', 1, 'os_atrasada_42_20260327', 'os', 42, '2026-03-27 13:39:27'),
(316, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 7 dia(s).', 0, 'os_atrasada_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(317, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 7 dia(s).', 0, 'os_atrasada_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(319, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 7 dia(s).', 0, 'os_atrasada_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(320, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 7 dia(s).', 1, 'os_atrasada_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(321, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 11 dia(s).', 0, 'os_atrasada_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(322, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 11 dia(s).', 0, 'os_atrasada_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(324, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 11 dia(s).', 0, 'os_atrasada_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(325, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 11 dia(s).', 1, 'os_atrasada_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(326, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 14 dia(s).', 0, 'os_atrasada_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(327, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 14 dia(s).', 0, 'os_atrasada_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(329, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 14 dia(s).', 0, 'os_atrasada_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(330, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 14 dia(s).', 1, 'os_atrasada_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(331, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 14 dia(s).', 0, 'os_atrasada_49_20260327', 'os', 49, '2026-03-27 13:39:27'),
(332, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 14 dia(s).', 0, 'os_atrasada_49_20260327', 'os', 49, '2026-03-27 13:39:27'),
(334, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 14 dia(s).', 0, 'os_atrasada_49_20260327', 'os', 49, '2026-03-27 13:39:27'),
(335, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 14 dia(s).', 1, 'os_atrasada_49_20260327', 'os', 49, '2026-03-27 13:39:27'),
(336, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(337, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(338, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(339, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(340, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260327', 'os', 44, '2026-03-27 13:39:27'),
(341, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(342, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(343, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(344, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(345, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260327', 'os', 45, '2026-03-27 13:39:27'),
(346, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(347, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(348, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(349, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(350, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260327', 'os', 46, '2026-03-27 13:39:27'),
(351, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260327', 'os', 47, '2026-03-27 13:39:27'),
(352, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260327', 'os', 47, '2026-03-27 13:39:27'),
(353, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260327', 'os', 47, '2026-03-27 13:39:27'),
(354, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260327', 'os', 47, '2026-03-27 13:39:27'),
(355, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260327', 'os', 47, '2026-03-27 13:39:27'),
(356, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260327', 'os', 48, '2026-03-27 13:39:27'),
(357, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260327', 'os', 48, '2026-03-27 13:39:27'),
(358, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260327', 'os', 48, '2026-03-27 13:39:27'),
(359, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260327', 'os', 48, '2026-03-27 13:39:27'),
(360, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260327', 'os', 48, '2026-03-27 13:39:27'),
(361, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260327', 'os', 54, '2026-03-27 13:39:27'),
(362, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260327', 'os', 54, '2026-03-27 13:39:27'),
(363, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260327', 'os', 54, '2026-03-27 13:39:27'),
(364, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260327', 'os', 54, '2026-03-27 13:39:27'),
(365, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260327', 'os', 54, '2026-03-27 13:39:27'),
(366, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260327', 'os', 55, '2026-03-27 13:39:27'),
(367, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260327', 'os', 55, '2026-03-27 13:39:27'),
(368, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_55_20260327', 'os', 55, '2026-03-27 13:39:27'),
(369, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_55_20260327', 'os', 55, '2026-03-27 13:39:27'),
(370, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0017 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_55_20260327', 'os', 55, '2026-03-27 13:39:27'),
(371, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260327', 'os', 56, '2026-03-27 13:39:27'),
(372, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260327', 'os', 56, '2026-03-27 13:39:27'),
(373, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260327', 'os', 56, '2026-03-27 13:39:27'),
(374, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260327', 'os', 56, '2026-03-27 13:39:27'),
(375, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260327', 'os', 56, '2026-03-27 13:39:27'),
(376, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260327', 'conta_receber', 1, '2026-03-27 13:39:27'),
(377, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260327', 'conta_receber', 1, '2026-03-27 13:39:27'),
(378, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260327', 'conta_receber', 1, '2026-03-27 13:39:27'),
(379, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260327', 'conta_receber', 1, '2026-03-27 13:39:27'),
(380, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260327', 'conta_receber', 1, '2026-03-27 13:39:27'),
(461, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 8 dia(s).', 0, 'os_atrasada_39_20260328', 'os', 39, '2026-03-28 12:31:21'),
(462, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 8 dia(s).', 0, 'os_atrasada_39_20260328', 'os', 39, '2026-03-28 12:31:21'),
(464, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 8 dia(s).', 0, 'os_atrasada_39_20260328', 'os', 39, '2026-03-28 12:31:21'),
(465, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 8 dia(s).', 1, 'os_atrasada_39_20260328', 'os', 39, '2026-03-28 12:31:21'),
(466, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 5 dia(s).', 0, 'os_atrasada_40_20260328', 'os', 40, '2026-03-28 12:31:21'),
(467, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 5 dia(s).', 0, 'os_atrasada_40_20260328', 'os', 40, '2026-03-28 12:31:21'),
(469, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 5 dia(s).', 0, 'os_atrasada_40_20260328', 'os', 40, '2026-03-28 12:31:22'),
(470, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 5 dia(s).', 1, 'os_atrasada_40_20260328', 'os', 40, '2026-03-28 12:31:22'),
(471, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_42_20260328', 'os', 42, '2026-03-28 12:31:22'),
(472, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_42_20260328', 'os', 42, '2026-03-28 12:31:22'),
(474, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_42_20260328', 'os', 42, '2026-03-28 12:31:22'),
(475, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0004 está atrasada há 2 dia(s).', 1, 'os_atrasada_42_20260328', 'os', 42, '2026-03-28 12:31:22'),
(476, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 8 dia(s).', 0, 'os_atrasada_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(477, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 8 dia(s).', 0, 'os_atrasada_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(479, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 8 dia(s).', 0, 'os_atrasada_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(480, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 8 dia(s).', 1, 'os_atrasada_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(481, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 12 dia(s).', 0, 'os_atrasada_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(482, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 12 dia(s).', 0, 'os_atrasada_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(484, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 12 dia(s).', 0, 'os_atrasada_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(485, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 12 dia(s).', 1, 'os_atrasada_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(486, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 15 dia(s).', 0, 'os_atrasada_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(487, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 15 dia(s).', 0, 'os_atrasada_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(489, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 15 dia(s).', 0, 'os_atrasada_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(490, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 15 dia(s).', 1, 'os_atrasada_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(491, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 15 dia(s).', 0, 'os_atrasada_49_20260328', 'os', 49, '2026-03-28 12:31:22'),
(492, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 15 dia(s).', 0, 'os_atrasada_49_20260328', 'os', 49, '2026-03-28 12:31:22'),
(494, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 15 dia(s).', 0, 'os_atrasada_49_20260328', 'os', 49, '2026-03-28 12:31:22'),
(495, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 15 dia(s).', 1, 'os_atrasada_49_20260328', 'os', 49, '2026-03-28 12:31:22'),
(496, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(497, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(498, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(499, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(500, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260328', 'os', 44, '2026-03-28 12:31:22'),
(501, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(502, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(503, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(504, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(505, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0007 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_45_20260328', 'os', 45, '2026-03-28 12:31:22'),
(506, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(507, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(508, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(509, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(510, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0008 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_46_20260328', 'os', 46, '2026-03-28 12:31:22'),
(511, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260328', 'os', 47, '2026-03-28 12:31:22'),
(512, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260328', 'os', 47, '2026-03-28 12:31:22'),
(513, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260328', 'os', 47, '2026-03-28 12:31:22'),
(514, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260328', 'os', 47, '2026-03-28 12:31:22'),
(515, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260328', 'os', 47, '2026-03-28 12:31:22'),
(516, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260328', 'os', 48, '2026-03-28 12:31:22'),
(517, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260328', 'os', 48, '2026-03-28 12:31:22'),
(518, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260328', 'os', 48, '2026-03-28 12:31:22'),
(519, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260328', 'os', 48, '2026-03-28 12:31:22'),
(520, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260328', 'os', 48, '2026-03-28 12:31:22'),
(521, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260328', 'os', 54, '2026-03-28 12:31:22'),
(522, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260328', 'os', 54, '2026-03-28 12:31:22'),
(523, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260328', 'os', 54, '2026-03-28 12:31:22'),
(524, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260328', 'os', 54, '2026-03-28 12:31:22'),
(525, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260328', 'os', 54, '2026-03-28 12:31:22'),
(526, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260328', 'os', 56, '2026-03-28 12:31:22'),
(527, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260328', 'os', 56, '2026-03-28 12:31:22'),
(528, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260328', 'os', 56, '2026-03-28 12:31:22'),
(529, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260328', 'os', 56, '2026-03-28 12:31:22'),
(530, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260328', 'os', 56, '2026-03-28 12:31:22'),
(531, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260328', 'conta_receber', 1, '2026-03-28 12:31:22'),
(532, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260328', 'conta_receber', 1, '2026-03-28 12:31:22'),
(533, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260328', 'conta_receber', 1, '2026-03-28 12:31:22'),
(534, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260328', 'conta_receber', 1, '2026-03-28 12:31:22'),
(535, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260328', 'conta_receber', 1, '2026-03-28 12:31:22'),
(731, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 9 dia(s).', 0, 'os_atrasada_39_20260329', 'os', 39, '2026-03-29 08:55:50'),
(732, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 9 dia(s).', 0, 'os_atrasada_39_20260329', 'os', 39, '2026-03-29 08:55:50'),
(734, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 9 dia(s).', 0, 'os_atrasada_39_20260329', 'os', 39, '2026-03-29 08:55:50'),
(735, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 9 dia(s).', 1, 'os_atrasada_39_20260329', 'os', 39, '2026-03-29 08:55:50'),
(736, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 6 dia(s).', 0, 'os_atrasada_40_20260329', 'os', 40, '2026-03-29 08:55:50'),
(737, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 6 dia(s).', 0, 'os_atrasada_40_20260329', 'os', 40, '2026-03-29 08:55:50'),
(739, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 6 dia(s).', 0, 'os_atrasada_40_20260329', 'os', 40, '2026-03-29 08:55:50'),
(740, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 6 dia(s).', 1, 'os_atrasada_40_20260329', 'os', 40, '2026-03-29 08:55:50'),
(741, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 9 dia(s).', 0, 'os_atrasada_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(742, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 9 dia(s).', 0, 'os_atrasada_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(744, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 9 dia(s).', 0, 'os_atrasada_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(745, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 9 dia(s).', 1, 'os_atrasada_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(746, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 13 dia(s).', 0, 'os_atrasada_45_20260329', 'os', 45, '2026-03-29 08:55:50'),
(747, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 13 dia(s).', 0, 'os_atrasada_45_20260329', 'os', 45, '2026-03-29 08:55:50'),
(749, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 13 dia(s).', 0, 'os_atrasada_45_20260329', 'os', 45, '2026-03-29 08:55:50'),
(750, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 13 dia(s).', 1, 'os_atrasada_45_20260329', 'os', 45, '2026-03-29 08:55:50'),
(751, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 16 dia(s).', 0, 'os_atrasada_46_20260329', 'os', 46, '2026-03-29 08:55:50'),
(752, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 16 dia(s).', 0, 'os_atrasada_46_20260329', 'os', 46, '2026-03-29 08:55:50'),
(754, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 16 dia(s).', 0, 'os_atrasada_46_20260329', 'os', 46, '2026-03-29 08:55:50'),
(755, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 16 dia(s).', 1, 'os_atrasada_46_20260329', 'os', 46, '2026-03-29 08:55:50'),
(756, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 16 dia(s).', 0, 'os_atrasada_49_20260329', 'os', 49, '2026-03-29 08:55:50'),
(757, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 16 dia(s).', 0, 'os_atrasada_49_20260329', 'os', 49, '2026-03-29 08:55:50'),
(759, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 16 dia(s).', 0, 'os_atrasada_49_20260329', 'os', 49, '2026-03-29 08:55:50'),
(760, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 16 dia(s).', 1, 'os_atrasada_49_20260329', 'os', 49, '2026-03-29 08:55:50'),
(761, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(762, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(763, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(764, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_44_20260329', 'os', 44, '2026-03-29 08:55:50');
INSERT INTO `notificacoes` (`id`, `usuario_id`, `tipo`, `titulo`, `mensagem`, `lida`, `chave_evento`, `referencia_tipo`, `referencia_id`, `created_at`) VALUES
(765, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0006 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_44_20260329', 'os', 44, '2026-03-29 08:55:50'),
(766, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260329', 'os', 47, '2026-03-29 08:55:50'),
(767, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260329', 'os', 47, '2026-03-29 08:55:50'),
(768, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260329', 'os', 47, '2026-03-29 08:55:50'),
(769, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260329', 'os', 47, '2026-03-29 08:55:50'),
(770, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260329', 'os', 47, '2026-03-29 08:55:50'),
(771, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260329', 'os', 48, '2026-03-29 08:55:50'),
(772, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260329', 'os', 48, '2026-03-29 08:55:50'),
(773, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260329', 'os', 48, '2026-03-29 08:55:50'),
(774, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260329', 'os', 48, '2026-03-29 08:55:50'),
(775, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260329', 'os', 48, '2026-03-29 08:55:50'),
(776, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260329', 'os', 54, '2026-03-29 08:55:50'),
(777, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260329', 'os', 54, '2026-03-29 08:55:50'),
(778, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260329', 'os', 54, '2026-03-29 08:55:50'),
(779, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260329', 'os', 54, '2026-03-29 08:55:50'),
(780, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260329', 'os', 54, '2026-03-29 08:55:50'),
(781, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260329', 'os', 56, '2026-03-29 08:55:50'),
(782, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260329', 'os', 56, '2026-03-29 08:55:50'),
(783, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260329', 'os', 56, '2026-03-29 08:55:50'),
(784, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260329', 'os', 56, '2026-03-29 08:55:51'),
(785, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260329', 'os', 56, '2026-03-29 08:55:51'),
(786, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260329', 'conta_receber', 1, '2026-03-29 08:55:51'),
(787, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260329', 'conta_receber', 1, '2026-03-29 08:55:51'),
(788, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260329', 'conta_receber', 1, '2026-03-29 08:55:51'),
(789, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260329', 'conta_receber', 1, '2026-03-29 08:55:51'),
(790, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260329', 'conta_receber', 1, '2026-03-29 08:55:51'),
(791, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 10 dia(s).', 0, 'os_atrasada_39_20260330', 'os', 39, '2026-03-30 08:36:50'),
(792, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 10 dia(s).', 0, 'os_atrasada_39_20260330', 'os', 39, '2026-03-30 08:36:50'),
(794, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 10 dia(s).', 0, 'os_atrasada_39_20260330', 'os', 39, '2026-03-30 08:36:50'),
(795, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0001 está atrasada há 10 dia(s).', 1, 'os_atrasada_39_20260330', 'os', 39, '2026-03-30 08:36:50'),
(796, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 7 dia(s).', 0, 'os_atrasada_40_20260330', 'os', 40, '2026-03-30 08:36:50'),
(797, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 7 dia(s).', 0, 'os_atrasada_40_20260330', 'os', 40, '2026-03-30 08:36:50'),
(799, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 7 dia(s).', 0, 'os_atrasada_40_20260330', 'os', 40, '2026-03-30 08:36:50'),
(800, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0002 está atrasada há 7 dia(s).', 1, 'os_atrasada_40_20260330', 'os', 40, '2026-03-30 08:36:50'),
(801, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 10 dia(s).', 0, 'os_atrasada_44_20260330', 'os', 44, '2026-03-30 08:36:50'),
(802, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 10 dia(s).', 0, 'os_atrasada_44_20260330', 'os', 44, '2026-03-30 08:36:50'),
(804, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 10 dia(s).', 0, 'os_atrasada_44_20260330', 'os', 44, '2026-03-30 08:36:50'),
(805, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0006 está atrasada há 10 dia(s).', 1, 'os_atrasada_44_20260330', 'os', 44, '2026-03-30 08:36:50'),
(806, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 14 dia(s).', 0, 'os_atrasada_45_20260330', 'os', 45, '2026-03-30 08:36:50'),
(807, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 14 dia(s).', 0, 'os_atrasada_45_20260330', 'os', 45, '2026-03-30 08:36:50'),
(809, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 14 dia(s).', 0, 'os_atrasada_45_20260330', 'os', 45, '2026-03-30 08:36:51'),
(810, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0007 está atrasada há 14 dia(s).', 1, 'os_atrasada_45_20260330', 'os', 45, '2026-03-30 08:36:51'),
(811, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 17 dia(s).', 0, 'os_atrasada_46_20260330', 'os', 46, '2026-03-30 08:36:51'),
(812, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 17 dia(s).', 0, 'os_atrasada_46_20260330', 'os', 46, '2026-03-30 08:36:51'),
(814, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 17 dia(s).', 0, 'os_atrasada_46_20260330', 'os', 46, '2026-03-30 08:36:51'),
(815, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0008 está atrasada há 17 dia(s).', 1, 'os_atrasada_46_20260330', 'os', 46, '2026-03-30 08:36:51'),
(816, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 17 dia(s).', 0, 'os_atrasada_49_20260330', 'os', 49, '2026-03-30 08:36:51'),
(817, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 17 dia(s).', 0, 'os_atrasada_49_20260330', 'os', 49, '2026-03-30 08:36:51'),
(819, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 17 dia(s).', 0, 'os_atrasada_49_20260330', 'os', 49, '2026-03-30 08:36:51'),
(820, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 17 dia(s).', 1, 'os_atrasada_49_20260330', 'os', 49, '2026-03-30 08:36:51'),
(821, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260330', 'os', 47, '2026-03-30 08:36:51'),
(822, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260330', 'os', 47, '2026-03-30 08:36:51'),
(823, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260330', 'os', 47, '2026-03-30 08:36:51'),
(824, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_47_20260330', 'os', 47, '2026-03-30 08:36:51'),
(825, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0009 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_47_20260330', 'os', 47, '2026-03-30 08:36:51'),
(826, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260330', 'os', 48, '2026-03-30 08:36:51'),
(827, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260330', 'os', 48, '2026-03-30 08:36:51'),
(828, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260330', 'os', 48, '2026-03-30 08:36:51'),
(829, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_48_20260330', 'os', 48, '2026-03-30 08:36:51'),
(830, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0010 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_48_20260330', 'os', 48, '2026-03-30 08:36:51'),
(831, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260330', 'os', 54, '2026-03-30 08:36:51'),
(832, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260330', 'os', 54, '2026-03-30 08:36:51'),
(833, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260330', 'os', 54, '2026-03-30 08:36:51'),
(834, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260330', 'os', 54, '2026-03-30 08:36:51'),
(835, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260330', 'os', 54, '2026-03-30 08:36:51'),
(836, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260330', 'os', 56, '2026-03-30 08:36:51'),
(837, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260330', 'os', 56, '2026-03-30 08:36:51'),
(838, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260330', 'os', 56, '2026-03-30 08:36:51'),
(839, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_56_20260330', 'os', 56, '2026-03-30 08:36:51'),
(840, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0018 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_56_20260330', 'os', 56, '2026-03-30 08:36:51'),
(841, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260330', 'conta_receber', 1, '2026-03-30 08:36:51'),
(842, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260330', 'conta_receber', 1, '2026-03-30 08:36:51'),
(843, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260330', 'conta_receber', 1, '2026-03-30 08:36:51'),
(844, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260330', 'conta_receber', 1, '2026-03-30 08:36:51'),
(845, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260330', 'conta_receber', 1, '2026-03-30 08:36:51'),
(956, 1, 'expediente_inicio', 'Expediente iniciado', 'corte iniciou o expediente.', 0, 'expediente_inicio_7_20260330', 'usuario', 7, '2026-03-30 09:01:36'),
(957, 12, 'expediente_inicio', 'Expediente iniciado', 'corte iniciou o expediente.', 0, 'expediente_inicio_7_20260330', 'usuario', 7, '2026-03-30 09:01:36'),
(958, 1, 'expediente_fim', 'Expediente finalizado', 'corte finalizou o expediente.', 0, 'expediente_fim_7_20260330', 'usuario', 7, '2026-03-30 09:07:17'),
(959, 12, 'expediente_fim', 'Expediente finalizado', 'corte finalizou o expediente.', 0, 'expediente_fim_7_20260330', 'usuario', 7, '2026-03-30 09:07:17'),
(960, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260330', 'usuario', 8, '2026-03-30 09:09:07'),
(961, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260330', 'usuario', 8, '2026-03-30 09:09:07'),
(962, 1, 'expediente_inicio', 'Expediente iniciado', 'solda iniciou o expediente.', 0, 'expediente_inicio_9_20260330', 'usuario', 9, '2026-03-30 09:10:07'),
(963, 12, 'expediente_inicio', 'Expediente iniciado', 'solda iniciou o expediente.', 0, 'expediente_inicio_9_20260330', 'usuario', 9, '2026-03-30 09:10:07'),
(964, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260330', 'usuario', 17, '2026-03-30 11:58:58'),
(965, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260330', 'usuario', 17, '2026-03-30 11:58:58'),
(966, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260330', 'usuario', 8, '2026-03-30 12:06:59'),
(967, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260330', 'usuario', 8, '2026-03-30 12:06:59'),
(968, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260330', 'usuario', 17, '2026-03-30 13:55:53'),
(969, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260330', 'usuario', 17, '2026-03-30 13:55:53'),
(1090, 1, 'expediente_inicio', 'Expediente iniciado', 'Jose Algusto iniciou o expediente.', 0, 'expediente_inicio_16_20260330', 'usuario', 16, '2026-03-30 19:43:45'),
(1091, 12, 'expediente_inicio', 'Expediente iniciado', 'Jose Algusto iniciou o expediente.', 0, 'expediente_inicio_16_20260330', 'usuario', 16, '2026-03-30 19:43:45'),
(1092, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260331', 'usuario', 17, '2026-03-31 09:17:11'),
(1093, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260331', 'usuario', 17, '2026-03-31 09:17:11'),
(1094, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260331', 'usuario', 8, '2026-03-31 10:08:52'),
(1095, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260331', 'usuario', 8, '2026-03-31 10:08:52'),
(1096, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 18 dia(s).', 0, 'os_atrasada_49_20260331', 'os', 49, '2026-03-31 11:39:33'),
(1097, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 18 dia(s).', 0, 'os_atrasada_49_20260331', 'os', 49, '2026-03-31 11:39:33'),
(1099, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 18 dia(s).', 0, 'os_atrasada_49_20260331', 'os', 49, '2026-03-31 11:39:33'),
(1100, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 18 dia(s).', 1, 'os_atrasada_49_20260331', 'os', 49, '2026-03-31 11:39:33'),
(1101, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 1 dia(s).', 0, 'os_atrasada_57_20260331', 'os', 57, '2026-03-31 11:39:33'),
(1102, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 1 dia(s).', 0, 'os_atrasada_57_20260331', 'os', 57, '2026-03-31 11:39:33'),
(1104, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 1 dia(s).', 0, 'os_atrasada_57_20260331', 'os', 57, '2026-03-31 11:39:33'),
(1105, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 1 dia(s).', 1, 'os_atrasada_57_20260331', 'os', 57, '2026-03-31 11:39:33'),
(1106, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260331', 'os', 54, '2026-03-31 11:39:33'),
(1107, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260331', 'os', 54, '2026-03-31 11:39:33'),
(1108, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260331', 'os', 54, '2026-03-31 11:39:33'),
(1109, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_54_20260331', 'os', 54, '2026-03-31 11:39:33'),
(1110, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0016 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_54_20260331', 'os', 54, '2026-03-31 11:39:33'),
(1111, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260331', 'conta_receber', 1, '2026-03-31 11:39:33'),
(1112, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260331', 'conta_receber', 1, '2026-03-31 11:39:33'),
(1113, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260331', 'conta_receber', 1, '2026-03-31 11:39:33'),
(1114, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260331', 'conta_receber', 1, '2026-03-31 11:39:33'),
(1115, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260331', 'conta_receber', 1, '2026-03-31 11:39:33'),
(1126, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 5 dia(s).', 0, 'os_atrasada_59_20260331', 'os', 59, '2026-03-31 12:26:31'),
(1127, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 5 dia(s).', 0, 'os_atrasada_59_20260331', 'os', 59, '2026-03-31 12:26:31'),
(1129, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 5 dia(s).', 0, 'os_atrasada_59_20260331', 'os', 59, '2026-03-31 12:26:31'),
(1130, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 5 dia(s).', 1, 'os_atrasada_59_20260331', 'os', 59, '2026-03-31 12:26:31'),
(1156, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260331', 'usuario', 17, '2026-03-31 20:03:59'),
(1157, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260331', 'usuario', 17, '2026-03-31 20:03:59'),
(1158, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260331', 'usuario', 8, '2026-03-31 20:23:18'),
(1159, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260331', 'usuario', 8, '2026-03-31 20:23:18'),
(1160, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260401', 'usuario', 17, '2026-04-01 09:10:47'),
(1161, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260401', 'usuario', 17, '2026-04-01 09:10:47'),
(1162, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260401', 'usuario', 17, '2026-04-01 09:10:47'),
(1163, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260401', 'usuario', 17, '2026-04-01 09:10:47'),
(1164, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260401', 'usuario', 8, '2026-04-01 10:04:47'),
(1165, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260401', 'usuario', 8, '2026-04-01 10:04:47'),
(1166, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260401', 'usuario', 8, '2026-04-01 22:32:02'),
(1167, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260401', 'usuario', 8, '2026-04-01 22:32:02'),
(1168, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260402', 'usuario', 8, '2026-04-02 10:08:27'),
(1169, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260402', 'usuario', 8, '2026-04-02 10:08:27'),
(1170, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260402', 'usuario', 17, '2026-04-02 10:13:52'),
(1171, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260402', 'usuario', 17, '2026-04-02 10:13:52'),
(1172, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260402', 'usuario', 8, '2026-04-02 20:02:26'),
(1173, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260402', 'usuario', 8, '2026-04-02 20:02:26'),
(1174, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260402', 'usuario', 17, '2026-04-02 20:03:49'),
(1175, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260402', 'usuario', 17, '2026-04-02 20:03:49'),
(1176, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 24 dia(s).', 0, 'os_atrasada_49_20260406', 'os', 49, '2026-04-06 07:53:21'),
(1177, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 24 dia(s).', 0, 'os_atrasada_49_20260406', 'os', 49, '2026-04-06 07:53:21'),
(1179, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 24 dia(s).', 0, 'os_atrasada_49_20260406', 'os', 49, '2026-04-06 07:53:21'),
(1180, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 24 dia(s).', 1, 'os_atrasada_49_20260406', 'os', 49, '2026-04-06 07:53:21'),
(1181, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 7 dia(s).', 0, 'os_atrasada_57_20260406', 'os', 57, '2026-04-06 07:53:21'),
(1182, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 7 dia(s).', 0, 'os_atrasada_57_20260406', 'os', 57, '2026-04-06 07:53:21'),
(1184, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 7 dia(s).', 0, 'os_atrasada_57_20260406', 'os', 57, '2026-04-06 07:53:21'),
(1185, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 7 dia(s).', 1, 'os_atrasada_57_20260406', 'os', 57, '2026-04-06 07:53:21'),
(1186, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 11 dia(s).', 0, 'os_atrasada_59_20260406', 'os', 59, '2026-04-06 07:53:21'),
(1187, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 11 dia(s).', 0, 'os_atrasada_59_20260406', 'os', 59, '2026-04-06 07:53:21'),
(1189, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 11 dia(s).', 0, 'os_atrasada_59_20260406', 'os', 59, '2026-04-06 07:53:21'),
(1190, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0021 está atrasada há 11 dia(s).', 1, 'os_atrasada_59_20260406', 'os', 59, '2026-04-06 07:53:21'),
(1191, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0022 está atrasada há 5 dia(s).', 0, 'os_atrasada_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1192, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0022 está atrasada há 5 dia(s).', 0, 'os_atrasada_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1194, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0022 está atrasada há 5 dia(s).', 0, 'os_atrasada_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1195, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0022 está atrasada há 5 dia(s).', 1, 'os_atrasada_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1196, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0022 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1197, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0022 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1198, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0022 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1199, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0022 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1200, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0022 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_60_20260406', 'os', 60, '2026-04-06 07:53:21'),
(1201, 1, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260406', 'conta_receber', 1, '2026-04-06 07:53:21'),
(1202, 4, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260406', 'conta_receber', 1, '2026-04-06 07:53:21'),
(1203, 6, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260406', 'conta_receber', 1, '2026-04-06 07:53:21'),
(1204, 12, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260406', 'conta_receber', 1, '2026-04-06 07:53:21'),
(1205, 18, 'venda_aguardando_pagamento', 'Venda aguardando pagamento', 'Há título pendente da venda VND-0016 aguardando pagamento.', 0, 'venda_pgto_1_20260406', 'conta_receber', 1, '2026-04-06 07:53:21'),
(1404, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260406', 'usuario', 17, '2026-04-06 10:09:50'),
(1405, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260406', 'usuario', 17, '2026-04-06 10:09:50'),
(1406, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260406', 'usuario', 8, '2026-04-06 10:37:03'),
(1407, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260406', 'usuario', 8, '2026-04-06 10:37:03'),
(1408, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260406', 'usuario', 8, '2026-04-06 20:01:19'),
(1409, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260406', 'usuario', 8, '2026-04-06 20:01:19'),
(1410, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260406', 'usuario', 17, '2026-04-06 20:01:25'),
(1411, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260406', 'usuario', 17, '2026-04-06 20:01:25'),
(1412, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260407', 'usuario', 17, '2026-04-07 09:05:01'),
(1413, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260407', 'usuario', 17, '2026-04-07 09:05:01'),
(1414, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260407', 'usuario', 8, '2026-04-07 10:21:38'),
(1415, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260407', 'usuario', 8, '2026-04-07 10:21:38'),
(1416, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260407', 'usuario', 8, '2026-04-07 20:01:57'),
(1417, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260407', 'usuario', 8, '2026-04-07 20:01:57'),
(1418, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260407', 'usuario', 17, '2026-04-07 20:02:29'),
(1419, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260407', 'usuario', 17, '2026-04-07 20:02:29'),
(1420, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260408', 'usuario', 8, '2026-04-08 08:11:00'),
(1421, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260408', 'usuario', 8, '2026-04-08 08:11:00'),
(1422, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260408', 'usuario', 17, '2026-04-08 08:15:58'),
(1423, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260408', 'usuario', 17, '2026-04-08 08:15:58'),
(1424, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 2 dia(s).', 0, 'os_atrasada_43_20260408', 'os', 43, '2026-04-08 13:08:33'),
(1425, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 2 dia(s).', 0, 'os_atrasada_43_20260408', 'os', 43, '2026-04-08 13:08:33'),
(1426, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 2 dia(s).', 0, 'os_atrasada_43_20260408', 'os', 43, '2026-04-08 13:08:33'),
(1427, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 2 dia(s).', 1, 'os_atrasada_43_20260408', 'os', 43, '2026-04-08 13:08:33'),
(1428, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 26 dia(s).', 0, 'os_atrasada_49_20260408', 'os', 49, '2026-04-08 13:08:33'),
(1429, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 26 dia(s).', 0, 'os_atrasada_49_20260408', 'os', 49, '2026-04-08 13:08:33'),
(1430, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 26 dia(s).', 0, 'os_atrasada_49_20260408', 'os', 49, '2026-04-08 13:08:33'),
(1431, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 26 dia(s).', 1, 'os_atrasada_49_20260408', 'os', 49, '2026-04-08 13:08:33'),
(1432, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 9 dia(s).', 0, 'os_atrasada_57_20260408', 'os', 57, '2026-04-08 13:08:33'),
(1433, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 9 dia(s).', 0, 'os_atrasada_57_20260408', 'os', 57, '2026-04-08 13:08:33'),
(1434, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 9 dia(s).', 0, 'os_atrasada_57_20260408', 'os', 57, '2026-04-08 13:08:33'),
(1435, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 9 dia(s).', 1, 'os_atrasada_57_20260408', 'os', 57, '2026-04-08 13:08:33'),
(1436, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260408', 'os', 63, '2026-04-08 13:08:33'),
(1437, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260408', 'os', 63, '2026-04-08 13:08:33'),
(1438, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_63_20260408', 'os', 63, '2026-04-08 13:08:33'),
(1439, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260408', 'os', 63, '2026-04-08 13:08:33'),
(1440, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_63_20260408', 'os', 63, '2026-04-08 13:08:33'),
(1441, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260408', 'os', 64, '2026-04-08 13:08:33'),
(1442, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260408', 'os', 64, '2026-04-08 13:08:33'),
(1443, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260408', 'os', 64, '2026-04-08 13:08:33'),
(1444, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260408', 'os', 64, '2026-04-08 13:08:33'),
(1445, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260408', 'os', 64, '2026-04-08 13:08:34'),
(1512, 1, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260408', 'usuario', 16, '2026-04-08 13:37:23'),
(1513, 12, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260408', 'usuario', 16, '2026-04-08 13:37:23'),
(1558, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260408', 'usuario', 8, '2026-04-08 21:07:56'),
(1559, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260408', 'usuario', 8, '2026-04-08 21:07:56'),
(1560, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260409', 'usuario', 17, '2026-04-09 09:16:56'),
(1561, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260409', 'usuario', 17, '2026-04-09 09:16:56'),
(1562, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260409', 'usuario', 8, '2026-04-09 10:03:35'),
(1563, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260409', 'usuario', 8, '2026-04-09 10:03:35'),
(1564, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 3 dia(s).', 0, 'os_atrasada_43_20260409', 'os', 43, '2026-04-09 10:26:02'),
(1565, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 3 dia(s).', 0, 'os_atrasada_43_20260409', 'os', 43, '2026-04-09 10:26:02'),
(1566, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 3 dia(s).', 0, 'os_atrasada_43_20260409', 'os', 43, '2026-04-09 10:26:02'),
(1567, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 3 dia(s).', 1, 'os_atrasada_43_20260409', 'os', 43, '2026-04-09 10:26:02'),
(1568, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 27 dia(s).', 0, 'os_atrasada_49_20260409', 'os', 49, '2026-04-09 10:26:02'),
(1569, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 27 dia(s).', 0, 'os_atrasada_49_20260409', 'os', 49, '2026-04-09 10:26:02'),
(1570, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 27 dia(s).', 0, 'os_atrasada_49_20260409', 'os', 49, '2026-04-09 10:26:02'),
(1571, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 27 dia(s).', 1, 'os_atrasada_49_20260409', 'os', 49, '2026-04-09 10:26:02'),
(1572, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 10 dia(s).', 0, 'os_atrasada_57_20260409', 'os', 57, '2026-04-09 10:26:02'),
(1573, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 10 dia(s).', 0, 'os_atrasada_57_20260409', 'os', 57, '2026-04-09 10:26:02'),
(1574, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 10 dia(s).', 0, 'os_atrasada_57_20260409', 'os', 57, '2026-04-09 10:26:02'),
(1575, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 10 dia(s).', 1, 'os_atrasada_57_20260409', 'os', 57, '2026-04-09 10:26:02'),
(1576, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 1 dia(s).', 0, 'os_atrasada_74_20260409', 'os', 74, '2026-04-09 10:26:02'),
(1577, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 1 dia(s).', 0, 'os_atrasada_74_20260409', 'os', 74, '2026-04-09 10:26:02'),
(1578, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 1 dia(s).', 0, 'os_atrasada_74_20260409', 'os', 74, '2026-04-09 10:26:02'),
(1579, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 1 dia(s).', 1, 'os_atrasada_74_20260409', 'os', 74, '2026-04-09 10:26:02'),
(1580, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260409', 'os', 63, '2026-04-09 10:26:02'),
(1581, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260409', 'os', 63, '2026-04-09 10:26:02'),
(1582, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_63_20260409', 'os', 63, '2026-04-09 10:26:02'),
(1583, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_63_20260409', 'os', 63, '2026-04-09 10:26:02'),
(1584, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0025 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_63_20260409', 'os', 63, '2026-04-09 10:26:02'),
(1585, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260409', 'os', 64, '2026-04-09 10:26:02'),
(1586, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260409', 'os', 64, '2026-04-09 10:26:02'),
(1587, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260409', 'os', 64, '2026-04-09 10:26:02'),
(1588, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260409', 'os', 64, '2026-04-09 10:26:02'),
(1589, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260409', 'os', 64, '2026-04-09 10:26:02'),
(1720, 1, 'expediente_inicio', 'Expediente iniciado', 'corte iniciou o expediente.', 0, 'expediente_inicio_7_20260409', 'usuario', 7, '2026-04-09 10:56:19'),
(1721, 12, 'expediente_inicio', 'Expediente iniciado', 'corte iniciou o expediente.', 0, 'expediente_inicio_7_20260409', 'usuario', 7, '2026-04-09 10:56:19'),
(1722, 1, 'expediente_fim', 'Expediente finalizado', 'corte finalizou o expediente.', 0, 'expediente_fim_7_20260409', 'usuario', 7, '2026-04-09 10:56:24'),
(1723, 12, 'expediente_fim', 'Expediente finalizado', 'corte finalizou o expediente.', 0, 'expediente_fim_7_20260409', 'usuario', 7, '2026-04-09 10:56:24'),
(1726, 1, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260409', 'usuario', 16, '2026-04-09 10:58:07'),
(1727, 12, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260409', 'usuario', 16, '2026-04-09 10:58:07'),
(1770, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260409', 'usuario', 8, '2026-04-09 20:25:45'),
(1771, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260409', 'usuario', 8, '2026-04-09 20:25:45'),
(1772, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260409', 'usuario', 17, '2026-04-09 22:35:39'),
(1773, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260409', 'usuario', 17, '2026-04-09 22:35:39'),
(1774, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260410', 'usuario', 17, '2026-04-10 09:12:54'),
(1775, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260410', 'usuario', 17, '2026-04-10 09:12:54'),
(1776, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 4 dia(s).', 0, 'os_atrasada_43_20260410', 'os', 43, '2026-04-10 10:06:21'),
(1777, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 4 dia(s).', 0, 'os_atrasada_43_20260410', 'os', 43, '2026-04-10 10:06:21'),
(1778, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 4 dia(s).', 0, 'os_atrasada_43_20260410', 'os', 43, '2026-04-10 10:06:21'),
(1779, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 4 dia(s).', 1, 'os_atrasada_43_20260410', 'os', 43, '2026-04-10 10:06:21'),
(1780, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 28 dia(s).', 0, 'os_atrasada_49_20260410', 'os', 49, '2026-04-10 10:06:21'),
(1781, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 28 dia(s).', 0, 'os_atrasada_49_20260410', 'os', 49, '2026-04-10 10:06:21'),
(1782, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 28 dia(s).', 0, 'os_atrasada_49_20260410', 'os', 49, '2026-04-10 10:06:21'),
(1783, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 28 dia(s).', 1, 'os_atrasada_49_20260410', 'os', 49, '2026-04-10 10:06:21'),
(1784, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 11 dia(s).', 0, 'os_atrasada_57_20260410', 'os', 57, '2026-04-10 10:06:21'),
(1785, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 11 dia(s).', 0, 'os_atrasada_57_20260410', 'os', 57, '2026-04-10 10:06:21'),
(1786, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 11 dia(s).', 0, 'os_atrasada_57_20260410', 'os', 57, '2026-04-10 10:06:21'),
(1787, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 11 dia(s).', 1, 'os_atrasada_57_20260410', 'os', 57, '2026-04-10 10:06:21'),
(1788, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 1 dia(s).', 0, 'os_atrasada_63_20260410', 'os', 63, '2026-04-10 10:06:21'),
(1789, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 1 dia(s).', 0, 'os_atrasada_63_20260410', 'os', 63, '2026-04-10 10:06:21'),
(1790, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 1 dia(s).', 0, 'os_atrasada_63_20260410', 'os', 63, '2026-04-10 10:06:21'),
(1791, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 1 dia(s).', 1, 'os_atrasada_63_20260410', 'os', 63, '2026-04-10 10:06:21'),
(1792, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 1 dia(s).', 0, 'os_atrasada_65_20260410', 'os', 65, '2026-04-10 10:06:21'),
(1793, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 1 dia(s).', 0, 'os_atrasada_65_20260410', 'os', 65, '2026-04-10 10:06:21'),
(1794, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 1 dia(s).', 0, 'os_atrasada_65_20260410', 'os', 65, '2026-04-10 10:06:21'),
(1795, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 1 dia(s).', 1, 'os_atrasada_65_20260410', 'os', 65, '2026-04-10 10:06:21'),
(1796, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 1 dia(s).', 0, 'os_atrasada_71_20260410', 'os', 71, '2026-04-10 10:06:21'),
(1797, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 1 dia(s).', 0, 'os_atrasada_71_20260410', 'os', 71, '2026-04-10 10:06:21'),
(1798, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 1 dia(s).', 0, 'os_atrasada_71_20260410', 'os', 71, '2026-04-10 10:06:21'),
(1799, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 1 dia(s).', 1, 'os_atrasada_71_20260410', 'os', 71, '2026-04-10 10:06:21'),
(1800, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 1 dia(s).', 0, 'os_atrasada_72_20260410', 'os', 72, '2026-04-10 10:06:21'),
(1801, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 1 dia(s).', 0, 'os_atrasada_72_20260410', 'os', 72, '2026-04-10 10:06:22'),
(1802, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 1 dia(s).', 0, 'os_atrasada_72_20260410', 'os', 72, '2026-04-10 10:06:22'),
(1803, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 1 dia(s).', 1, 'os_atrasada_72_20260410', 'os', 72, '2026-04-10 10:06:22'),
(1804, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 2 dia(s).', 0, 'os_atrasada_74_20260410', 'os', 74, '2026-04-10 10:06:22'),
(1805, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 2 dia(s).', 0, 'os_atrasada_74_20260410', 'os', 74, '2026-04-10 10:06:22'),
(1806, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 2 dia(s).', 0, 'os_atrasada_74_20260410', 'os', 74, '2026-04-10 10:06:22'),
(1807, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 2 dia(s).', 1, 'os_atrasada_74_20260410', 'os', 74, '2026-04-10 10:06:22'),
(1808, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260410', 'os', 64, '2026-04-10 10:06:22'),
(1809, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260410', 'os', 64, '2026-04-10 10:06:22'),
(1810, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260410', 'os', 64, '2026-04-10 10:06:22'),
(1811, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260410', 'os', 64, '2026-04-10 10:06:22'),
(1812, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260410', 'os', 64, '2026-04-10 10:06:22'),
(1813, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260410', 'os', 75, '2026-04-10 10:06:22'),
(1814, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260410', 'os', 75, '2026-04-10 10:06:22'),
(1815, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260410', 'os', 75, '2026-04-10 10:06:22'),
(1816, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260410', 'os', 75, '2026-04-10 10:06:22'),
(1817, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260410', 'os', 75, '2026-04-10 10:06:22'),
(1818, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260410', 'usuario', 8, '2026-04-10 10:09:07'),
(1819, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260410', 'usuario', 8, '2026-04-10 10:09:07'),
(1904, 1, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260410', 'usuario', 16, '2026-04-10 10:18:17'),
(1905, 12, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260410', 'usuario', 16, '2026-04-10 10:18:17'),
(2032, 1, 'expediente_inicio', 'Expediente iniciado', 'solda iniciou o expediente.', 0, 'expediente_inicio_9_20260410', 'usuario', 9, '2026-04-10 10:55:41'),
(2033, 12, 'expediente_inicio', 'Expediente iniciado', 'solda iniciou o expediente.', 0, 'expediente_inicio_9_20260410', 'usuario', 9, '2026-04-10 10:55:41'),
(2118, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260410', 'usuario', 17, '2026-04-10 18:52:58'),
(2119, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260410', 'usuario', 17, '2026-04-10 18:52:58'),
(2120, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 7 dia(s).', 0, 'os_atrasada_43_20260413', 'os', 43, '2026-04-13 09:59:56'),
(2121, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 7 dia(s).', 0, 'os_atrasada_43_20260413', 'os', 43, '2026-04-13 09:59:56'),
(2122, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 7 dia(s).', 0, 'os_atrasada_43_20260413', 'os', 43, '2026-04-13 09:59:56');
INSERT INTO `notificacoes` (`id`, `usuario_id`, `tipo`, `titulo`, `mensagem`, `lida`, `chave_evento`, `referencia_tipo`, `referencia_id`, `created_at`) VALUES
(2123, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 7 dia(s).', 1, 'os_atrasada_43_20260413', 'os', 43, '2026-04-13 09:59:56'),
(2124, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 31 dia(s).', 0, 'os_atrasada_49_20260413', 'os', 49, '2026-04-13 09:59:56'),
(2125, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 31 dia(s).', 0, 'os_atrasada_49_20260413', 'os', 49, '2026-04-13 09:59:56'),
(2126, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 31 dia(s).', 0, 'os_atrasada_49_20260413', 'os', 49, '2026-04-13 09:59:56'),
(2127, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 31 dia(s).', 1, 'os_atrasada_49_20260413', 'os', 49, '2026-04-13 09:59:56'),
(2128, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 14 dia(s).', 0, 'os_atrasada_57_20260413', 'os', 57, '2026-04-13 09:59:56'),
(2129, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 14 dia(s).', 0, 'os_atrasada_57_20260413', 'os', 57, '2026-04-13 09:59:56'),
(2130, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 14 dia(s).', 0, 'os_atrasada_57_20260413', 'os', 57, '2026-04-13 09:59:56'),
(2131, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 14 dia(s).', 1, 'os_atrasada_57_20260413', 'os', 57, '2026-04-13 09:59:56'),
(2132, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 4 dia(s).', 0, 'os_atrasada_63_20260413', 'os', 63, '2026-04-13 09:59:56'),
(2133, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 4 dia(s).', 0, 'os_atrasada_63_20260413', 'os', 63, '2026-04-13 09:59:56'),
(2134, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 4 dia(s).', 0, 'os_atrasada_63_20260413', 'os', 63, '2026-04-13 09:59:56'),
(2135, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 4 dia(s).', 1, 'os_atrasada_63_20260413', 'os', 63, '2026-04-13 09:59:56'),
(2136, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 4 dia(s).', 0, 'os_atrasada_65_20260413', 'os', 65, '2026-04-13 09:59:56'),
(2137, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 4 dia(s).', 0, 'os_atrasada_65_20260413', 'os', 65, '2026-04-13 09:59:56'),
(2138, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 4 dia(s).', 0, 'os_atrasada_65_20260413', 'os', 65, '2026-04-13 09:59:56'),
(2139, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 4 dia(s).', 1, 'os_atrasada_65_20260413', 'os', 65, '2026-04-13 09:59:56'),
(2140, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 4 dia(s).', 0, 'os_atrasada_71_20260413', 'os', 71, '2026-04-13 09:59:56'),
(2141, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 4 dia(s).', 0, 'os_atrasada_71_20260413', 'os', 71, '2026-04-13 09:59:56'),
(2142, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 4 dia(s).', 0, 'os_atrasada_71_20260413', 'os', 71, '2026-04-13 09:59:56'),
(2143, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 4 dia(s).', 1, 'os_atrasada_71_20260413', 'os', 71, '2026-04-13 09:59:56'),
(2144, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_72_20260413', 'os', 72, '2026-04-13 09:59:56'),
(2145, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_72_20260413', 'os', 72, '2026-04-13 09:59:56'),
(2146, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 4 dia(s).', 0, 'os_atrasada_72_20260413', 'os', 72, '2026-04-13 09:59:56'),
(2147, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 4 dia(s).', 1, 'os_atrasada_72_20260413', 'os', 72, '2026-04-13 09:59:56'),
(2148, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 5 dia(s).', 0, 'os_atrasada_74_20260413', 'os', 74, '2026-04-13 09:59:56'),
(2149, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 5 dia(s).', 0, 'os_atrasada_74_20260413', 'os', 74, '2026-04-13 09:59:56'),
(2150, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 5 dia(s).', 0, 'os_atrasada_74_20260413', 'os', 74, '2026-04-13 09:59:57'),
(2151, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 5 dia(s).', 1, 'os_atrasada_74_20260413', 'os', 74, '2026-04-13 09:59:57'),
(2152, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260413', 'os', 64, '2026-04-13 09:59:57'),
(2153, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260413', 'os', 64, '2026-04-13 09:59:57'),
(2154, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260413', 'os', 64, '2026-04-13 09:59:57'),
(2155, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260413', 'os', 64, '2026-04-13 09:59:57'),
(2156, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260413', 'os', 64, '2026-04-13 09:59:57'),
(2157, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260413', 'os', 75, '2026-04-13 09:59:57'),
(2158, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260413', 'os', 75, '2026-04-13 09:59:57'),
(2159, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260413', 'os', 75, '2026-04-13 09:59:57'),
(2160, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260413', 'os', 75, '2026-04-13 09:59:57'),
(2161, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260413', 'os', 75, '2026-04-13 09:59:57'),
(2162, 1, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260413', 'usuario', 16, '2026-04-13 10:03:35'),
(2163, 12, 'expediente_inicio', 'Expediente iniciado', 'Marcos Antonio iniciou o expediente.', 0, 'expediente_inicio_16_20260413', 'usuario', 16, '2026-04-13 10:03:35'),
(2164, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260413', 'usuario', 17, '2026-04-13 10:04:09'),
(2165, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260413', 'usuario', 17, '2026-04-13 10:04:09'),
(2334, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260413', 'usuario', 8, '2026-04-13 10:25:13'),
(2335, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260413', 'usuario', 8, '2026-04-13 10:25:13'),
(2546, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260413', 'usuario', 8, '2026-04-13 20:01:38'),
(2547, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260413', 'usuario', 8, '2026-04-13 20:01:38'),
(2548, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260413', 'usuario', 17, '2026-04-13 20:02:50'),
(2549, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260413', 'usuario', 17, '2026-04-13 20:02:50'),
(2550, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260414', 'usuario', 17, '2026-04-14 09:09:01'),
(2551, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260414', 'usuario', 17, '2026-04-14 09:09:01'),
(2552, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260414', 'usuario', 8, '2026-04-14 09:19:51'),
(2553, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260414', 'usuario', 8, '2026-04-14 09:19:51'),
(2554, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 8 dia(s).', 0, 'os_atrasada_43_20260414', 'os', 43, '2026-04-14 10:56:14'),
(2555, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 8 dia(s).', 0, 'os_atrasada_43_20260414', 'os', 43, '2026-04-14 10:56:14'),
(2556, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 8 dia(s).', 0, 'os_atrasada_43_20260414', 'os', 43, '2026-04-14 10:56:14'),
(2557, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 8 dia(s).', 1, 'os_atrasada_43_20260414', 'os', 43, '2026-04-14 10:56:14'),
(2558, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 32 dia(s).', 0, 'os_atrasada_49_20260414', 'os', 49, '2026-04-14 10:56:14'),
(2559, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 32 dia(s).', 0, 'os_atrasada_49_20260414', 'os', 49, '2026-04-14 10:56:14'),
(2560, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 32 dia(s).', 0, 'os_atrasada_49_20260414', 'os', 49, '2026-04-14 10:56:14'),
(2561, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 32 dia(s).', 1, 'os_atrasada_49_20260414', 'os', 49, '2026-04-14 10:56:14'),
(2562, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 15 dia(s).', 0, 'os_atrasada_57_20260414', 'os', 57, '2026-04-14 10:56:14'),
(2563, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 15 dia(s).', 0, 'os_atrasada_57_20260414', 'os', 57, '2026-04-14 10:56:14'),
(2564, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 15 dia(s).', 0, 'os_atrasada_57_20260414', 'os', 57, '2026-04-14 10:56:14'),
(2565, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 15 dia(s).', 1, 'os_atrasada_57_20260414', 'os', 57, '2026-04-14 10:56:14'),
(2566, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 1 dia(s).', 0, 'os_atrasada_62_20260414', 'os', 62, '2026-04-14 10:56:14'),
(2567, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 1 dia(s).', 0, 'os_atrasada_62_20260414', 'os', 62, '2026-04-14 10:56:14'),
(2568, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 1 dia(s).', 0, 'os_atrasada_62_20260414', 'os', 62, '2026-04-14 10:56:14'),
(2569, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 1 dia(s).', 1, 'os_atrasada_62_20260414', 'os', 62, '2026-04-14 10:56:14'),
(2570, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 5 dia(s).', 0, 'os_atrasada_63_20260414', 'os', 63, '2026-04-14 10:56:14'),
(2571, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 5 dia(s).', 0, 'os_atrasada_63_20260414', 'os', 63, '2026-04-14 10:56:14'),
(2572, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 5 dia(s).', 0, 'os_atrasada_63_20260414', 'os', 63, '2026-04-14 10:56:14'),
(2573, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 5 dia(s).', 1, 'os_atrasada_63_20260414', 'os', 63, '2026-04-14 10:56:14'),
(2574, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 5 dia(s).', 0, 'os_atrasada_65_20260414', 'os', 65, '2026-04-14 10:56:14'),
(2575, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 5 dia(s).', 0, 'os_atrasada_65_20260414', 'os', 65, '2026-04-14 10:56:14'),
(2576, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 5 dia(s).', 0, 'os_atrasada_65_20260414', 'os', 65, '2026-04-14 10:56:14'),
(2577, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 5 dia(s).', 1, 'os_atrasada_65_20260414', 'os', 65, '2026-04-14 10:56:14'),
(2578, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 5 dia(s).', 0, 'os_atrasada_71_20260414', 'os', 71, '2026-04-14 10:56:14'),
(2579, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 5 dia(s).', 0, 'os_atrasada_71_20260414', 'os', 71, '2026-04-14 10:56:14'),
(2580, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 5 dia(s).', 0, 'os_atrasada_71_20260414', 'os', 71, '2026-04-14 10:56:14'),
(2581, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 5 dia(s).', 1, 'os_atrasada_71_20260414', 'os', 71, '2026-04-14 10:56:14'),
(2582, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_72_20260414', 'os', 72, '2026-04-14 10:56:14'),
(2583, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_72_20260414', 'os', 72, '2026-04-14 10:56:14'),
(2584, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 5 dia(s).', 0, 'os_atrasada_72_20260414', 'os', 72, '2026-04-14 10:56:14'),
(2585, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 5 dia(s).', 1, 'os_atrasada_72_20260414', 'os', 72, '2026-04-14 10:56:14'),
(2586, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 6 dia(s).', 0, 'os_atrasada_74_20260414', 'os', 74, '2026-04-14 10:56:14'),
(2587, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 6 dia(s).', 0, 'os_atrasada_74_20260414', 'os', 74, '2026-04-14 10:56:14'),
(2588, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 6 dia(s).', 0, 'os_atrasada_74_20260414', 'os', 74, '2026-04-14 10:56:14'),
(2589, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 6 dia(s).', 1, 'os_atrasada_74_20260414', 'os', 74, '2026-04-14 10:56:14'),
(2590, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_76_20260414', 'os', 76, '2026-04-14 10:56:14'),
(2591, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_76_20260414', 'os', 76, '2026-04-14 10:56:14'),
(2592, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 1 dia(s).', 0, 'os_atrasada_76_20260414', 'os', 76, '2026-04-14 10:56:14'),
(2593, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 1 dia(s).', 1, 'os_atrasada_76_20260414', 'os', 76, '2026-04-14 10:56:14'),
(2594, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260414', 'os', 64, '2026-04-14 10:56:14'),
(2595, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260414', 'os', 64, '2026-04-14 10:56:14'),
(2596, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260414', 'os', 64, '2026-04-14 10:56:14'),
(2597, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260414', 'os', 64, '2026-04-14 10:56:14'),
(2598, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260414', 'os', 64, '2026-04-14 10:56:14'),
(2599, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260414', 'os', 75, '2026-04-14 10:56:14'),
(2600, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260414', 'os', 75, '2026-04-14 10:56:14'),
(2601, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260414', 'os', 75, '2026-04-14 10:56:14'),
(2602, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260414', 'os', 75, '2026-04-14 10:56:14'),
(2603, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260414', 'os', 75, '2026-04-14 10:56:14'),
(2804, 1, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260414', 'usuario', 8, '2026-04-14 20:00:15'),
(2805, 12, 'expediente_fim', 'Expediente finalizado', 'dobra finalizou o expediente.', 0, 'expediente_fim_8_20260414', 'usuario', 8, '2026-04-14 20:00:15'),
(2806, 1, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260414', 'usuario', 17, '2026-04-14 20:00:52'),
(2807, 12, 'expediente_fim', 'Expediente finalizado', 'Paulinho finalizou o expediente.', 0, 'expediente_fim_17_20260414', 'usuario', 17, '2026-04-14 20:00:52'),
(2808, 1, 'componentes_os', 'Componentes da venda disponíveis', 'A O.S OS-0038 recebeu a lista de componentes dos produtos vendidos para revisão do gerente.', 0, 'componentes_os_80', 'os', 80, '2026-04-14 20:01:07'),
(2809, 2, 'componentes_os', 'Componentes da venda disponíveis', 'A O.S OS-0038 recebeu a lista de componentes dos produtos vendidos para revisão do gerente.', 0, 'componentes_os_80', 'os', 80, '2026-04-14 20:01:07'),
(2810, 12, 'componentes_os', 'Componentes da venda disponíveis', 'A O.S OS-0038 recebeu a lista de componentes dos produtos vendidos para revisão do gerente.', 0, 'componentes_os_80', 'os', 80, '2026-04-14 20:01:07'),
(2811, 16, 'componentes_os', 'Componentes da venda disponíveis', 'A O.S OS-0038 recebeu a lista de componentes dos produtos vendidos para revisão do gerente.', 0, 'componentes_os_80', 'os', 80, '2026-04-14 20:01:07'),
(2812, 1, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260415', 'usuario', 8, '2026-04-15 09:07:23'),
(2813, 12, 'expediente_inicio', 'Expediente iniciado', 'dobra iniciou o expediente.', 0, 'expediente_inicio_8_20260415', 'usuario', 8, '2026-04-15 09:07:23'),
(2814, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 9 dia(s).', 0, 'os_atrasada_43_20260415', 'os', 43, '2026-04-15 10:16:28'),
(2815, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 9 dia(s).', 0, 'os_atrasada_43_20260415', 'os', 43, '2026-04-15 10:16:28'),
(2816, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 9 dia(s).', 0, 'os_atrasada_43_20260415', 'os', 43, '2026-04-15 10:16:28'),
(2817, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0005 está atrasada há 9 dia(s).', 0, 'os_atrasada_43_20260415', 'os', 43, '2026-04-15 10:16:28'),
(2818, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 33 dia(s).', 0, 'os_atrasada_49_20260415', 'os', 49, '2026-04-15 10:16:28'),
(2819, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 33 dia(s).', 0, 'os_atrasada_49_20260415', 'os', 49, '2026-04-15 10:16:28'),
(2820, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 33 dia(s).', 0, 'os_atrasada_49_20260415', 'os', 49, '2026-04-15 10:16:28'),
(2821, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0011 está atrasada há 33 dia(s).', 0, 'os_atrasada_49_20260415', 'os', 49, '2026-04-15 10:16:28'),
(2822, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 16 dia(s).', 0, 'os_atrasada_57_20260415', 'os', 57, '2026-04-15 10:16:28'),
(2823, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 16 dia(s).', 0, 'os_atrasada_57_20260415', 'os', 57, '2026-04-15 10:16:28'),
(2824, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 16 dia(s).', 0, 'os_atrasada_57_20260415', 'os', 57, '2026-04-15 10:16:28'),
(2825, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0019 está atrasada há 16 dia(s).', 0, 'os_atrasada_57_20260415', 'os', 57, '2026-04-15 10:16:28'),
(2826, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 2 dia(s).', 0, 'os_atrasada_62_20260415', 'os', 62, '2026-04-15 10:16:28'),
(2827, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 2 dia(s).', 0, 'os_atrasada_62_20260415', 'os', 62, '2026-04-15 10:16:28'),
(2828, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 2 dia(s).', 0, 'os_atrasada_62_20260415', 'os', 62, '2026-04-15 10:16:28'),
(2829, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0024 está atrasada há 2 dia(s).', 0, 'os_atrasada_62_20260415', 'os', 62, '2026-04-15 10:16:28'),
(2830, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 6 dia(s).', 0, 'os_atrasada_63_20260415', 'os', 63, '2026-04-15 10:16:28'),
(2831, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 6 dia(s).', 0, 'os_atrasada_63_20260415', 'os', 63, '2026-04-15 10:16:28'),
(2832, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 6 dia(s).', 0, 'os_atrasada_63_20260415', 'os', 63, '2026-04-15 10:16:28'),
(2833, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0025 está atrasada há 6 dia(s).', 0, 'os_atrasada_63_20260415', 'os', 63, '2026-04-15 10:16:28'),
(2834, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 6 dia(s).', 0, 'os_atrasada_65_20260415', 'os', 65, '2026-04-15 10:16:28'),
(2835, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 6 dia(s).', 0, 'os_atrasada_65_20260415', 'os', 65, '2026-04-15 10:16:28'),
(2836, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 6 dia(s).', 0, 'os_atrasada_65_20260415', 'os', 65, '2026-04-15 10:16:28'),
(2837, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0027 está atrasada há 6 dia(s).', 0, 'os_atrasada_65_20260415', 'os', 65, '2026-04-15 10:16:28'),
(2838, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 6 dia(s).', 0, 'os_atrasada_71_20260415', 'os', 71, '2026-04-15 10:16:28'),
(2839, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 6 dia(s).', 0, 'os_atrasada_71_20260415', 'os', 71, '2026-04-15 10:16:28'),
(2840, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 6 dia(s).', 0, 'os_atrasada_71_20260415', 'os', 71, '2026-04-15 10:16:28'),
(2841, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0033 está atrasada há 6 dia(s).', 0, 'os_atrasada_71_20260415', 'os', 71, '2026-04-15 10:16:28'),
(2842, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 6 dia(s).', 0, 'os_atrasada_72_20260415', 'os', 72, '2026-04-15 10:16:28'),
(2843, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 6 dia(s).', 0, 'os_atrasada_72_20260415', 'os', 72, '2026-04-15 10:16:28'),
(2844, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 6 dia(s).', 0, 'os_atrasada_72_20260415', 'os', 72, '2026-04-15 10:16:28'),
(2845, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0001 está atrasada há 6 dia(s).', 0, 'os_atrasada_72_20260415', 'os', 72, '2026-04-15 10:16:28'),
(2846, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 7 dia(s).', 0, 'os_atrasada_74_20260415', 'os', 74, '2026-04-15 10:16:28'),
(2847, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 7 dia(s).', 0, 'os_atrasada_74_20260415', 'os', 74, '2026-04-15 10:16:28'),
(2848, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 7 dia(s).', 0, 'os_atrasada_74_20260415', 'os', 74, '2026-04-15 10:16:28'),
(2849, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0003 está atrasada há 7 dia(s).', 0, 'os_atrasada_74_20260415', 'os', 74, '2026-04-15 10:16:28'),
(2850, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_76_20260415', 'os', 76, '2026-04-15 10:16:28'),
(2851, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_76_20260415', 'os', 76, '2026-04-15 10:16:28'),
(2852, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_76_20260415', 'os', 76, '2026-04-15 10:16:28'),
(2853, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-I0004 está atrasada há 2 dia(s).', 0, 'os_atrasada_76_20260415', 'os', 76, '2026-04-15 10:16:28'),
(2854, 1, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0037 está atrasada há 23 dia(s).', 0, 'os_atrasada_79_20260415', 'os', 79, '2026-04-15 10:16:28'),
(2855, 2, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0037 está atrasada há 23 dia(s).', 0, 'os_atrasada_79_20260415', 'os', 79, '2026-04-15 10:16:29'),
(2856, 12, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0037 está atrasada há 23 dia(s).', 0, 'os_atrasada_79_20260415', 'os', 79, '2026-04-15 10:16:29'),
(2857, 16, 'os_atrasada', 'O.S atrasada', 'A O.S OS-0037 está atrasada há 23 dia(s).', 0, 'os_atrasada_79_20260415', 'os', 79, '2026-04-15 10:16:29'),
(2858, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260415', 'os', 64, '2026-04-15 10:16:29'),
(2859, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260415', 'os', 64, '2026-04-15 10:16:29'),
(2860, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_64_20260415', 'os', 64, '2026-04-15 10:16:29'),
(2861, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260415', 'os', 64, '2026-04-15 10:16:29'),
(2862, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0026 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_64_20260415', 'os', 64, '2026-04-15 10:16:29'),
(2863, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260415', 'os', 75, '2026-04-15 10:16:29'),
(2864, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260415', 'os', 75, '2026-04-15 10:16:29'),
(2865, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_75_20260415', 'os', 75, '2026-04-15 10:16:29'),
(2866, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260415', 'os', 75, '2026-04-15 10:16:29'),
(2867, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0034 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_75_20260415', 'os', 75, '2026-04-15 10:16:29'),
(2868, 1, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0038 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_80_20260415', 'os', 80, '2026-04-15 10:16:29'),
(2869, 2, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0038 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_80_20260415', 'os', 80, '2026-04-15 10:16:29'),
(2870, 5, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0038 está aguardando projeto do setor técnico.', 1, 'projeto_aguardando_80_20260415', 'os', 80, '2026-04-15 10:16:29'),
(2871, 12, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0038 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_80_20260415', 'os', 80, '2026-04-15 10:16:29'),
(2872, 16, 'projeto_aguardando', 'Projeto aguardando', 'A O.S OS-0038 está aguardando projeto do setor técnico.', 0, 'projeto_aguardando_80_20260415', 'os', 80, '2026-04-15 10:16:29'),
(2932, 1, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260415', 'usuario', 17, '2026-04-15 12:22:07'),
(2933, 12, 'expediente_inicio', 'Expediente iniciado', 'Paulinho iniciou o expediente.', 0, 'expediente_inicio_17_20260415', 'usuario', 17, '2026-04-15 12:22:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `notificacoes_envios`
--

CREATE TABLE `notificacoes_envios` (
  `id` int(11) NOT NULL,
  `notificacao_id` int(11) NOT NULL,
  `canal` enum('interno','email','whatsapp') NOT NULL,
  `destino` varchar(160) DEFAULT NULL,
  `status` enum('PENDENTE','ENVIADO','ERRO') NOT NULL DEFAULT 'PENDENTE',
  `resposta` text DEFAULT NULL,
  `tentativas` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `sent_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `notificacoes_envios`
--

INSERT INTO `notificacoes_envios` (`id`, `notificacao_id`, `canal`, `destino`, `status`, `resposta`, `tentativas`, `created_at`, `sent_at`) VALUES
(1, 1, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(2, 1, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:23'),
(3, 2, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(4, 2, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:23'),
(7, 4, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(8, 4, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:23'),
(9, 5, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(10, 5, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:23'),
(11, 6, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(12, 6, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:23'),
(13, 7, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(14, 7, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:24'),
(17, 9, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(18, 9, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:24'),
(19, 10, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(20, 10, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:24'),
(21, 11, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(22, 11, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:34'),
(23, 12, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(24, 12, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:44'),
(27, 14, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(28, 14, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:44'),
(29, 15, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(30, 15, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:44'),
(31, 16, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(32, 16, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:44'),
(33, 17, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(34, 17, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:54'),
(37, 19, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(38, 19, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:54'),
(39, 20, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(40, 20, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:54'),
(41, 21, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(42, 21, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:54'),
(43, 22, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(44, 22, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:54'),
(47, 24, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(48, 24, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:55'),
(49, 25, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(50, 25, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:55'),
(51, 26, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(52, 26, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:55'),
(53, 27, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(54, 27, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:55'),
(57, 29, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(58, 29, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:44:55'),
(59, 30, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(60, 30, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:45:05'),
(61, 31, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:22', '2026-03-24 18:44:22'),
(62, 31, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:22', '2026-03-24 18:45:05'),
(63, 32, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(64, 32, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(65, 33, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(66, 33, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(67, 34, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(68, 34, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(69, 35, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(70, 35, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(71, 36, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(72, 36, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(73, 37, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(74, 37, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:05'),
(75, 38, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(76, 38, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:06'),
(77, 39, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(78, 39, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:16'),
(79, 40, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(80, 40, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:16'),
(81, 41, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(82, 41, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:16'),
(83, 42, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(84, 42, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:26'),
(85, 43, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(86, 43, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(87, 44, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(88, 44, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(89, 45, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(90, 45, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(91, 46, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(92, 46, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(93, 47, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(94, 47, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(95, 48, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(96, 48, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(97, 49, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(98, 49, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:36'),
(99, 50, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(100, 50, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:46'),
(101, 51, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(102, 51, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:46'),
(103, 52, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(104, 52, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:46'),
(105, 53, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(106, 53, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:56'),
(107, 54, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(108, 54, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:56'),
(109, 55, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(110, 55, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:57'),
(111, 56, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(112, 56, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:45:57'),
(113, 57, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(114, 57, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:46:07'),
(115, 58, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(116, 58, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:46:07'),
(117, 59, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(118, 59, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:46:07'),
(119, 60, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-24 21:44:23', '2026-03-24 18:44:23'),
(120, 60, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-24 21:44:23', '2026-03-24 18:46:07'),
(121, 61, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(122, 61, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:03'),
(123, 62, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(124, 62, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:04'),
(127, 64, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(128, 64, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(129, 65, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(130, 65, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(131, 66, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(132, 66, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(133, 67, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(134, 67, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(137, 69, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(138, 69, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(139, 70, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(140, 70, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:14'),
(141, 71, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(142, 71, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:24'),
(143, 72, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(144, 72, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:24'),
(147, 74, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(148, 74, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:34'),
(149, 75, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(150, 75, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:35'),
(151, 76, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(152, 76, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:35'),
(153, 77, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(154, 77, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:35'),
(157, 79, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(158, 79, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:35'),
(159, 80, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(160, 80, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:45'),
(161, 81, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(162, 81, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:45'),
(163, 82, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(164, 82, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:25:55'),
(167, 84, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(168, 84, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:26:05'),
(169, 85, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(170, 85, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:02', '2026-03-25 12:26:05'),
(171, 86, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:02', '2026-03-25 12:25:02'),
(172, 86, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:15'),
(173, 87, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(174, 87, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:15'),
(177, 89, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(178, 89, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:16'),
(179, 90, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(180, 90, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:26'),
(181, 91, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(182, 91, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(183, 92, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(184, 92, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(185, 93, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(186, 93, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(187, 94, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(188, 94, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(189, 95, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(190, 95, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(191, 96, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(192, 96, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(193, 97, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(194, 97, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(195, 98, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(196, 98, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:36'),
(197, 99, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(198, 99, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:46'),
(199, 100, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(200, 100, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:46'),
(201, 101, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(202, 101, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:46'),
(203, 102, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(204, 102, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:46'),
(205, 103, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(206, 103, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:56'),
(207, 104, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(208, 104, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(209, 105, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(210, 105, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(211, 106, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(212, 106, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(213, 107, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(214, 107, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(215, 108, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(216, 108, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(217, 109, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(218, 109, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:26:57'),
(219, 110, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(220, 110, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:07'),
(221, 111, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(222, 111, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:17'),
(223, 112, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(224, 112, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:17'),
(225, 113, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(226, 113, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:27'),
(227, 114, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(228, 114, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:27'),
(229, 115, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(230, 115, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:27'),
(231, 116, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(232, 116, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:27'),
(233, 117, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(234, 117, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:28'),
(235, 118, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(236, 118, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:28'),
(237, 119, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(238, 119, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:28'),
(239, 120, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(240, 120, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:38'),
(241, 121, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(242, 121, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:38'),
(243, 122, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(244, 122, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:38'),
(245, 123, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(246, 123, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:38'),
(247, 124, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(248, 124, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:38'),
(249, 125, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(250, 125, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:48'),
(251, 126, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(252, 126, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(253, 127, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(254, 127, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(255, 128, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(256, 128, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(257, 129, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(258, 129, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(259, 130, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(260, 130, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(261, 131, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(262, 131, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(263, 132, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(264, 132, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(265, 133, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(266, 133, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(267, 134, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(268, 134, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:49'),
(269, 135, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(270, 135, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:50'),
(271, 136, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(272, 136, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:50'),
(273, 137, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(274, 137, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:27:50'),
(275, 138, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(276, 138, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:28:00'),
(277, 139, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(278, 139, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:28:00'),
(279, 140, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-25 15:25:03', '2026-03-25 12:25:03'),
(280, 140, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-25 15:25:03', '2026-03-25 12:28:00'),
(281, 301, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(282, 301, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(283, 302, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(284, 302, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(287, 304, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(288, 304, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:28'),
(289, 305, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(290, 305, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:38'),
(291, 306, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(292, 306, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:38'),
(293, 307, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(294, 307, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:38'),
(297, 309, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(298, 309, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:38'),
(299, 310, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(300, 310, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:48'),
(301, 311, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(302, 311, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:48'),
(303, 312, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(304, 312, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:48'),
(307, 314, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(308, 314, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:58'),
(309, 315, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(310, 315, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:39:59'),
(311, 316, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(312, 316, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:09'),
(313, 317, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(314, 317, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:09'),
(317, 319, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(318, 319, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(319, 320, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(320, 320, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(321, 321, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(322, 321, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(323, 322, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(324, 322, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(327, 324, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(328, 324, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(329, 325, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(330, 325, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(331, 326, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(332, 326, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:10'),
(333, 327, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(334, 327, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:20'),
(337, 329, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(338, 329, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:21'),
(339, 330, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(340, 330, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:21'),
(341, 331, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(342, 331, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:21'),
(343, 332, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(344, 332, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:21'),
(347, 334, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(348, 334, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:22'),
(349, 335, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(350, 335, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:22'),
(351, 336, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(352, 336, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:22'),
(353, 337, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(354, 337, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:22'),
(355, 338, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(356, 338, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:32'),
(357, 339, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(358, 339, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:32'),
(359, 340, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(360, 340, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:42'),
(361, 341, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(362, 341, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(363, 342, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(364, 342, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(365, 343, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(366, 343, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(367, 344, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(368, 344, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(369, 345, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(370, 345, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(371, 346, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(372, 346, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:40:52'),
(373, 347, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(374, 347, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:12'),
(375, 348, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(376, 348, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:12'),
(377, 349, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(378, 349, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(379, 350, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(380, 350, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(381, 351, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(382, 351, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(383, 352, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(384, 352, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(385, 353, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(386, 353, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(387, 354, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(388, 354, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(389, 355, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(390, 355, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(391, 356, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(392, 356, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(393, 357, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(394, 357, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(395, 358, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(396, 358, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(397, 359, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(398, 359, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:13'),
(399, 360, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(400, 360, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:14'),
(401, 361, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(402, 361, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:24'),
(403, 362, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(404, 362, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:25'),
(405, 363, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(406, 363, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:25'),
(407, 364, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(408, 364, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:35'),
(409, 365, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(410, 365, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:37'),
(411, 366, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(412, 366, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:37'),
(413, 367, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(414, 367, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:37'),
(415, 368, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(416, 368, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:47'),
(417, 369, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(418, 369, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:47'),
(419, 370, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(420, 370, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:47'),
(421, 371, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(422, 371, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:47'),
(423, 372, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(424, 372, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:57'),
(425, 373, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(426, 373, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:57'),
(427, 374, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(428, 374, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:57'),
(429, 375, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(430, 375, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:57'),
(431, 376, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(432, 376, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:58'),
(433, 377, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(434, 377, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:58'),
(435, 378, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(436, 378, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:58'),
(437, 379, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(438, 379, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:58'),
(439, 380, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-27 13:39:27', '2026-03-27 10:39:27'),
(440, 380, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-27 13:39:27', '2026-03-27 10:41:58'),
(441, 461, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(442, 461, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:22'),
(443, 462, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(444, 462, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:32'),
(447, 464, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(448, 464, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:32'),
(449, 465, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(450, 465, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:32'),
(451, 466, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(452, 466, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:33'),
(453, 467, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:21', '2026-03-28 09:31:21'),
(454, 467, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:21', '2026-03-28 09:31:33'),
(457, 469, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(458, 469, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:33'),
(459, 470, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(460, 470, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:33'),
(461, 471, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(462, 471, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:33');
INSERT INTO `notificacoes_envios` (`id`, `notificacao_id`, `canal`, `destino`, `status`, `resposta`, `tentativas`, `created_at`, `sent_at`) VALUES
(463, 472, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(464, 472, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:33'),
(467, 474, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(468, 474, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:43'),
(469, 475, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(470, 475, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:53'),
(471, 476, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(472, 476, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:53'),
(473, 477, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(474, 477, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:53'),
(477, 479, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(478, 479, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:31:53'),
(479, 480, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(480, 480, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:03'),
(481, 481, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(482, 481, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:03'),
(483, 482, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(484, 482, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:04'),
(487, 484, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(488, 484, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:14'),
(489, 485, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(490, 485, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:14'),
(491, 486, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(492, 486, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:14'),
(493, 487, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(494, 487, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:14'),
(497, 489, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(498, 489, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:14'),
(499, 490, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(500, 490, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:34'),
(501, 491, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(502, 491, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:34'),
(503, 492, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(504, 492, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:34'),
(507, 494, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(508, 494, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:34'),
(509, 495, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(510, 495, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:34'),
(511, 496, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(512, 496, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:35'),
(513, 497, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(514, 497, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(515, 498, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(516, 498, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(517, 499, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(518, 499, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(519, 500, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(520, 500, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(521, 501, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(522, 501, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(523, 502, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(524, 502, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(525, 503, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(526, 503, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:45'),
(527, 504, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(528, 504, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:46'),
(529, 505, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(530, 505, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:46'),
(531, 506, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(532, 506, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:46'),
(533, 507, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(534, 507, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:46'),
(535, 508, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(536, 508, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:46'),
(537, 509, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(538, 509, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:56'),
(539, 510, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(540, 510, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:56'),
(541, 511, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(542, 511, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:56'),
(543, 512, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(544, 512, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:57'),
(545, 513, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(546, 513, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:57'),
(547, 514, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(548, 514, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:57'),
(549, 515, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(550, 515, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:57'),
(551, 516, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(552, 516, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:32:57'),
(553, 517, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(554, 517, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:07'),
(555, 518, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(556, 518, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:07'),
(557, 519, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(558, 519, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:07'),
(559, 520, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(560, 520, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:07'),
(561, 521, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(562, 521, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(563, 522, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(564, 522, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(565, 523, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(566, 523, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(567, 524, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(568, 524, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(569, 525, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(570, 525, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(571, 526, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(572, 526, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(573, 527, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(574, 527, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(575, 528, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(576, 528, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(577, 529, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(578, 529, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:08'),
(579, 530, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(580, 530, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:18'),
(581, 531, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(582, 531, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:18'),
(583, 532, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(584, 532, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:18'),
(585, 533, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(586, 533, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:18'),
(587, 534, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(588, 534, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:18'),
(589, 535, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-28 12:31:22', '2026-03-28 09:31:22'),
(590, 535, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-28 12:31:22', '2026-03-28 09:33:19'),
(591, 731, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(592, 731, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:55:51'),
(593, 732, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(594, 732, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:55:51'),
(597, 734, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(598, 734, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:55:51'),
(599, 735, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(600, 735, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:01'),
(601, 736, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(602, 736, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:01'),
(603, 737, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(604, 737, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:01'),
(607, 739, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(608, 739, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:01'),
(609, 740, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(610, 740, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:11'),
(611, 741, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(612, 741, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:21'),
(613, 742, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(614, 742, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:21'),
(617, 744, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(618, 744, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:21'),
(619, 745, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(620, 745, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:22'),
(621, 746, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(622, 746, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:32'),
(623, 747, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(624, 747, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:32'),
(627, 749, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(628, 749, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:32'),
(629, 750, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(630, 750, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:32'),
(631, 751, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(632, 751, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:32'),
(633, 752, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(634, 752, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(637, 754, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(638, 754, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(639, 755, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(640, 755, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(641, 756, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(642, 756, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(643, 757, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(644, 757, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(647, 759, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(648, 759, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(649, 760, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(650, 760, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:42'),
(651, 761, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(652, 761, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:43'),
(653, 762, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(654, 762, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:56:53'),
(655, 763, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(656, 763, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:03'),
(657, 764, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(658, 764, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:03'),
(659, 765, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(660, 765, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:13'),
(661, 766, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(662, 766, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:13'),
(663, 767, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(664, 767, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:23'),
(665, 768, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(666, 768, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:33'),
(667, 769, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(668, 769, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:33'),
(669, 770, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(670, 770, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:33'),
(671, 771, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(672, 771, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:33'),
(673, 772, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(674, 772, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(675, 773, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(676, 773, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(677, 774, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(678, 774, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(679, 775, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(680, 775, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(681, 776, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(682, 776, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(683, 777, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(684, 777, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(685, 778, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(686, 778, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:43'),
(687, 779, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(688, 779, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:44'),
(689, 780, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(690, 780, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:44'),
(691, 781, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(692, 781, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:44'),
(693, 782, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(694, 782, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:50', '2026-03-29 05:57:54'),
(695, 783, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:50', '2026-03-29 05:55:50'),
(696, 783, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:57:54'),
(697, 784, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(698, 784, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:57:54'),
(699, 785, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(700, 785, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:57:54'),
(701, 786, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(702, 786, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:58:04'),
(703, 787, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(704, 787, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:58:04'),
(705, 788, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(706, 788, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:58:04'),
(707, 789, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(708, 789, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:58:14'),
(709, 790, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-29 08:55:51', '2026-03-29 05:55:51'),
(710, 790, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-29 08:55:51', '2026-03-29 05:58:14'),
(711, 791, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(712, 791, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:36:51'),
(713, 792, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(714, 792, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:36:51'),
(717, 794, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(718, 794, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:36:51'),
(719, 795, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(720, 795, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:36:51'),
(721, 796, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(722, 796, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:36:51'),
(723, 797, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(724, 797, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:01'),
(727, 799, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(728, 799, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:11'),
(729, 800, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(730, 800, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(731, 801, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(732, 801, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(733, 802, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(734, 802, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(737, 804, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(738, 804, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(739, 805, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(740, 805, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(741, 806, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(742, 806, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(743, 807, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:50', '2026-03-30 05:36:50'),
(744, 807, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:50', '2026-03-30 05:37:12'),
(747, 809, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(748, 809, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:12'),
(749, 810, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(750, 810, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:12'),
(751, 811, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(752, 811, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:12'),
(753, 812, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(754, 812, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:12'),
(757, 814, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(758, 814, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:12'),
(759, 815, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(760, 815, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:13'),
(761, 816, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(762, 816, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:13'),
(763, 817, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(764, 817, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:13'),
(767, 819, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(768, 819, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:33'),
(769, 820, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(770, 820, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:33'),
(771, 821, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(772, 821, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:33'),
(773, 822, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(774, 822, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:33'),
(775, 823, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(776, 823, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:33'),
(777, 824, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(778, 824, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:43'),
(779, 825, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(780, 825, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:43'),
(781, 826, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(782, 826, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:53'),
(783, 827, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(784, 827, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:53'),
(785, 828, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(786, 828, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:53'),
(787, 829, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(788, 829, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:53'),
(789, 830, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(790, 830, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:37:53'),
(791, 831, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(792, 831, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:04'),
(793, 832, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(794, 832, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:04'),
(795, 833, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(796, 833, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:04'),
(797, 834, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(798, 834, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:04'),
(799, 835, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(800, 835, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:04'),
(801, 836, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(802, 836, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(803, 837, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(804, 837, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(805, 838, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(806, 838, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(807, 839, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(808, 839, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(809, 840, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(810, 840, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(811, 841, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(812, 841, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(813, 842, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(814, 842, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(815, 843, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(816, 843, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(817, 844, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(818, 844, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(819, 845, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 08:36:51', '2026-03-30 05:36:51'),
(820, 845, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-30 08:36:51', '2026-03-30 05:38:14'),
(821, 956, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:01:36', '2026-03-30 06:01:36'),
(822, 957, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:01:36', '2026-03-30 06:01:36'),
(823, 958, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:07:17', '2026-03-30 06:07:17'),
(824, 959, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:07:17', '2026-03-30 06:07:17'),
(825, 960, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:09:07', '2026-03-30 06:09:07'),
(826, 961, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:09:07', '2026-03-30 06:09:07'),
(827, 962, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:10:07', '2026-03-30 06:10:07'),
(828, 963, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 09:10:07', '2026-03-30 06:10:07'),
(829, 964, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 11:58:58', '2026-03-30 08:58:58'),
(830, 965, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 11:58:58', '2026-03-30 08:58:58'),
(831, 966, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 12:06:59', '2026-03-30 09:06:59'),
(832, 967, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 12:06:59', '2026-03-30 09:06:59'),
(833, 968, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 13:55:53', '2026-03-30 10:55:53'),
(834, 969, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 13:55:53', '2026-03-30 10:55:53'),
(835, 1090, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 19:43:45', '2026-03-30 16:43:45'),
(836, 1091, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-30 19:43:45', '2026-03-30 16:43:45'),
(837, 1092, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 09:17:11', '2026-03-31 06:17:11'),
(838, 1093, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 09:17:11', '2026-03-31 06:17:11'),
(839, 1094, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 10:08:52', '2026-03-31 07:08:52'),
(840, 1095, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 10:08:52', '2026-03-31 07:08:52'),
(841, 1096, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(842, 1096, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(843, 1097, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(844, 1097, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(847, 1099, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(848, 1099, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:39:43'),
(849, 1100, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(850, 1100, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:39:53'),
(851, 1101, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(852, 1101, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:39:53'),
(853, 1102, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(854, 1102, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:03'),
(857, 1104, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(858, 1104, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:03'),
(859, 1105, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(860, 1105, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:03'),
(861, 1106, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(862, 1106, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:04'),
(863, 1107, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(864, 1107, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(865, 1108, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(866, 1108, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(867, 1109, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(868, 1109, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(869, 1110, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(870, 1110, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(871, 1111, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(872, 1111, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(873, 1112, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(874, 1112, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(875, 1113, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(876, 1113, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:14'),
(877, 1114, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(878, 1114, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:24'),
(879, 1115, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 11:39:33', '2026-03-31 08:39:33'),
(880, 1115, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 11:39:33', '2026-03-31 08:40:24'),
(881, 1126, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(882, 1126, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(883, 1127, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(884, 1127, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(887, 1129, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(888, 1129, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(889, 1130, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(890, 1130, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-03-31 12:26:31', '2026-03-31 09:26:31'),
(891, 1156, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 20:03:59', '2026-03-31 17:03:59'),
(892, 1157, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 20:03:59', '2026-03-31 17:03:59'),
(893, 1158, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 20:23:18', '2026-03-31 17:23:18'),
(894, 1159, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-03-31 20:23:18', '2026-03-31 17:23:18'),
(895, 1160, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 09:10:47', '2026-04-01 06:10:47'),
(896, 1161, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 09:10:47', '2026-04-01 06:10:47'),
(897, 1162, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 09:10:47', '2026-04-01 06:10:47'),
(898, 1163, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 09:10:47', '2026-04-01 06:10:47'),
(899, 1164, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 10:04:47', '2026-04-01 07:04:47'),
(900, 1165, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 10:04:47', '2026-04-01 07:04:47'),
(901, 1166, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 22:32:02', '2026-04-01 19:32:02'),
(902, 1167, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-01 22:32:02', '2026-04-01 19:32:02'),
(903, 1168, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 10:08:27', '2026-04-02 07:08:27'),
(904, 1169, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 10:08:27', '2026-04-02 07:08:27'),
(905, 1170, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 10:13:52', '2026-04-02 07:13:52'),
(906, 1171, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 10:13:52', '2026-04-02 07:13:52'),
(907, 1172, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 20:02:26', '2026-04-02 17:02:26'),
(908, 1173, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 20:02:26', '2026-04-02 17:02:26'),
(909, 1174, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 20:03:49', '2026-04-02 17:03:49'),
(910, 1175, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-02 20:03:49', '2026-04-02 17:03:49'),
(911, 1176, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(912, 1176, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(913, 1177, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(914, 1177, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(917, 1179, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(918, 1179, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(919, 1180, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(920, 1180, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(921, 1181, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21');
INSERT INTO `notificacoes_envios` (`id`, `notificacao_id`, `canal`, `destino`, `status`, `resposta`, `tentativas`, `created_at`, `sent_at`) VALUES
(922, 1181, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:22'),
(923, 1182, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(924, 1182, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:32'),
(927, 1184, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(928, 1184, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:32'),
(929, 1185, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(930, 1185, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:32'),
(931, 1186, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(932, 1186, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 04:53:42'),
(933, 1187, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(934, 1187, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(937, 1189, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(938, 1189, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(939, 1190, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(940, 1190, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(941, 1191, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(942, 1191, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(943, 1192, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(944, 1192, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(947, 1194, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(948, 1194, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:16'),
(949, 1195, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(950, 1195, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:17'),
(951, 1196, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(952, 1196, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:17'),
(953, 1197, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(954, 1197, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(955, 1198, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(956, 1198, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(957, 1199, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(958, 1199, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(959, 1200, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(960, 1200, 'email', 'josei@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(961, 1201, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(962, 1201, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(963, 1202, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(964, 1202, 'email', 'camile@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(965, 1203, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(966, 1203, 'email', 'nilton@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:27'),
(967, 1204, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(968, 1204, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:37'),
(969, 1205, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 07:53:21', '2026-04-06 04:53:21'),
(970, 1205, 'email', 'guilherme@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-06 07:53:21', '2026-04-06 05:00:37'),
(971, 1404, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 10:09:50', '2026-04-06 07:09:50'),
(972, 1405, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 10:09:50', '2026-04-06 07:09:50'),
(973, 1406, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 10:37:03', '2026-04-06 07:37:03'),
(974, 1407, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 10:37:03', '2026-04-06 07:37:03'),
(975, 1408, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 20:01:19', '2026-04-06 17:01:19'),
(976, 1409, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 20:01:19', '2026-04-06 17:01:19'),
(977, 1410, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 20:01:25', '2026-04-06 17:01:25'),
(978, 1411, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-06 20:01:25', '2026-04-06 17:01:25'),
(979, 1412, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 09:05:01', '2026-04-07 06:05:01'),
(980, 1413, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 09:05:01', '2026-04-07 06:05:01'),
(981, 1414, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 10:21:38', '2026-04-07 07:21:38'),
(982, 1415, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 10:21:38', '2026-04-07 07:21:38'),
(983, 1416, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 20:01:57', '2026-04-07 17:01:57'),
(984, 1417, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 20:01:57', '2026-04-07 17:01:57'),
(985, 1418, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 20:02:29', '2026-04-07 17:02:29'),
(986, 1419, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-07 20:02:29', '2026-04-07 17:02:29'),
(987, 1420, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 08:11:00', '2026-04-08 05:11:00'),
(988, 1421, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 08:11:00', '2026-04-08 05:11:00'),
(989, 1422, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 08:15:58', '2026-04-08 05:15:58'),
(990, 1423, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 08:15:58', '2026-04-08 05:15:58'),
(991, 1424, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(992, 1424, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:34'),
(993, 1425, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(994, 1425, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:34'),
(995, 1426, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(996, 1426, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:34'),
(997, 1427, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(998, 1427, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:44'),
(999, 1428, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1000, 1428, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:44'),
(1001, 1429, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1002, 1429, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:44'),
(1003, 1430, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1004, 1430, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:54'),
(1005, 1431, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1006, 1431, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:54'),
(1007, 1432, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1008, 1432, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:08:54'),
(1009, 1433, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1010, 1433, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:04'),
(1011, 1434, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1012, 1434, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:04'),
(1013, 1435, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1014, 1435, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:04'),
(1015, 1436, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1016, 1436, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:04'),
(1017, 1437, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1018, 1437, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:04'),
(1019, 1438, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1020, 1438, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1021, 1439, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1022, 1439, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1023, 1440, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1024, 1440, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1025, 1441, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1026, 1441, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1027, 1442, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1028, 1442, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1029, 1443, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1030, 1443, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:33', '2026-04-08 10:09:15'),
(1031, 1444, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:33', '2026-04-08 10:08:33'),
(1032, 1444, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:34', '2026-04-08 10:09:15'),
(1033, 1445, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:08:34', '2026-04-08 10:08:34'),
(1034, 1445, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-08 13:08:34', '2026-04-08 10:09:15'),
(1035, 1512, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:37:23', '2026-04-08 10:37:23'),
(1036, 1513, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 13:37:23', '2026-04-08 10:37:23'),
(1037, 1558, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 21:07:56', '2026-04-08 18:07:56'),
(1038, 1559, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-08 21:07:56', '2026-04-08 18:07:56'),
(1039, 1560, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 09:16:56', '2026-04-09 06:16:56'),
(1040, 1561, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 09:16:56', '2026-04-09 06:16:56'),
(1041, 1562, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:03:35', '2026-04-09 07:03:35'),
(1042, 1563, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:03:35', '2026-04-09 07:03:35'),
(1043, 1564, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1044, 1564, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1045, 1565, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1046, 1565, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:12'),
(1047, 1566, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1048, 1566, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:12'),
(1049, 1567, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1050, 1567, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:12'),
(1051, 1568, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1052, 1568, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:12'),
(1053, 1569, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1054, 1569, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:22'),
(1055, 1570, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1056, 1570, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:22'),
(1057, 1571, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1058, 1571, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:22'),
(1059, 1572, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1060, 1572, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:22'),
(1061, 1573, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1062, 1573, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:32'),
(1063, 1574, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1064, 1574, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:32'),
(1065, 1575, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1066, 1575, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:33'),
(1067, 1576, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1068, 1576, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:33'),
(1069, 1577, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1070, 1577, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:43'),
(1071, 1578, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1072, 1578, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:43'),
(1073, 1579, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1074, 1579, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:43'),
(1075, 1580, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1076, 1580, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:43'),
(1077, 1581, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1078, 1581, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:43'),
(1079, 1582, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1080, 1582, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1081, 1583, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1082, 1583, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1083, 1584, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1084, 1584, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1085, 1585, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1086, 1585, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1087, 1586, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1088, 1586, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1089, 1587, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1090, 1587, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1091, 1588, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1092, 1588, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1093, 1589, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:26:02', '2026-04-09 07:26:02'),
(1094, 1589, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-09 10:26:02', '2026-04-09 07:26:53'),
(1095, 1720, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:56:19', '2026-04-09 07:56:19'),
(1096, 1721, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:56:19', '2026-04-09 07:56:19'),
(1097, 1722, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:56:24', '2026-04-09 07:56:24'),
(1098, 1723, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:56:24', '2026-04-09 07:56:24'),
(1099, 1726, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:58:07', '2026-04-09 07:58:07'),
(1100, 1727, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 10:58:07', '2026-04-09 07:58:07'),
(1101, 1770, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 20:25:45', '2026-04-09 17:25:45'),
(1102, 1771, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 20:25:45', '2026-04-09 17:25:45'),
(1103, 1772, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 22:35:39', '2026-04-09 19:35:39'),
(1104, 1773, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-09 22:35:39', '2026-04-09 19:35:39'),
(1105, 1774, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 09:12:54', '2026-04-10 06:12:54'),
(1106, 1775, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 09:12:54', '2026-04-10 06:12:54'),
(1107, 1776, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1108, 1776, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1109, 1777, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1110, 1777, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1111, 1778, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1112, 1778, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1113, 1779, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1114, 1779, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1115, 1780, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1116, 1780, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1117, 1781, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1118, 1781, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1119, 1782, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1120, 1782, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1121, 1783, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1122, 1783, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:22'),
(1123, 1784, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1124, 1784, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:32'),
(1125, 1785, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1126, 1785, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:42'),
(1127, 1786, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1128, 1786, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:43'),
(1129, 1787, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1130, 1787, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:43'),
(1131, 1788, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1132, 1788, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:43'),
(1133, 1789, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1134, 1789, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:53'),
(1135, 1790, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1136, 1790, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:53'),
(1137, 1791, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1138, 1791, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:06:53'),
(1139, 1792, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1140, 1792, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:03'),
(1141, 1793, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1142, 1793, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:03'),
(1143, 1794, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1144, 1794, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:03'),
(1145, 1795, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1146, 1795, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:03'),
(1147, 1796, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1148, 1796, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:13'),
(1149, 1797, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1150, 1797, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:13'),
(1151, 1798, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1152, 1798, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:13'),
(1153, 1799, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:21', '2026-04-10 07:06:21'),
(1154, 1799, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:21', '2026-04-10 07:07:13'),
(1155, 1800, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1156, 1800, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:13'),
(1157, 1801, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1158, 1801, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1159, 1802, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1160, 1802, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1161, 1803, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1162, 1803, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1163, 1804, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1164, 1804, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1165, 1805, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1166, 1805, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1167, 1806, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1168, 1806, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1169, 1807, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1170, 1807, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1171, 1808, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1172, 1808, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1173, 1809, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1174, 1809, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:14'),
(1175, 1810, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1176, 1810, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:24'),
(1177, 1811, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1178, 1811, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:24'),
(1179, 1812, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1180, 1812, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:34'),
(1181, 1813, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1182, 1813, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:34'),
(1183, 1814, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1184, 1814, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:44'),
(1185, 1815, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1186, 1815, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:54'),
(1187, 1816, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1188, 1816, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:07:55'),
(1189, 1817, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:06:22', '2026-04-10 07:06:22'),
(1190, 1817, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-10 10:06:22', '2026-04-10 07:08:05'),
(1191, 1818, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:09:07', '2026-04-10 07:09:07'),
(1192, 1819, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:09:07', '2026-04-10 07:09:07'),
(1193, 1904, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:18:17', '2026-04-10 07:18:17'),
(1194, 1905, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:18:17', '2026-04-10 07:18:17'),
(1195, 2032, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:55:41', '2026-04-10 07:55:41'),
(1196, 2033, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 10:55:41', '2026-04-10 07:55:41'),
(1197, 2118, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 18:52:58', '2026-04-10 15:52:58'),
(1198, 2119, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-10 18:52:58', '2026-04-10 15:52:58'),
(1199, 2120, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1200, 2120, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 06:59:57'),
(1201, 2121, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1202, 2121, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 06:59:57'),
(1203, 2122, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1204, 2122, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:07'),
(1205, 2123, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1206, 2123, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:07'),
(1207, 2124, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1208, 2124, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:07'),
(1209, 2125, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1210, 2125, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:07'),
(1211, 2126, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1212, 2126, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:07'),
(1213, 2127, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1214, 2127, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1215, 2128, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1216, 2128, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1217, 2129, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1218, 2129, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1219, 2130, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1220, 2130, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1221, 2131, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1222, 2131, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1223, 2132, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1224, 2132, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:17'),
(1225, 2133, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1226, 2133, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1227, 2134, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1228, 2134, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1229, 2135, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1230, 2135, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1231, 2136, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1232, 2136, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1233, 2137, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1234, 2137, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1235, 2138, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1236, 2138, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1237, 2139, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1238, 2139, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1239, 2140, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1240, 2140, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1241, 2141, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1242, 2141, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1243, 2142, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1244, 2142, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1245, 2143, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1246, 2143, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1247, 2144, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1248, 2144, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:18'),
(1249, 2145, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1250, 2145, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:28'),
(1251, 2146, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1252, 2146, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:28'),
(1253, 2147, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1254, 2147, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:38'),
(1255, 2148, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1256, 2148, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:39'),
(1257, 2149, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:56', '2026-04-13 06:59:56'),
(1258, 2149, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:56', '2026-04-13 07:00:39'),
(1259, 2150, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1260, 2150, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:39'),
(1261, 2151, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1262, 2151, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1263, 2152, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1264, 2152, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1265, 2153, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1266, 2153, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1267, 2154, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1268, 2154, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1269, 2155, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1270, 2155, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1271, 2156, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1272, 2156, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1273, 2157, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1274, 2157, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1275, 2158, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1276, 2158, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1277, 2159, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1278, 2159, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1279, 2160, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1280, 2160, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1281, 2161, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 09:59:57', '2026-04-13 06:59:57'),
(1282, 2161, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-13 09:59:57', '2026-04-13 07:00:49'),
(1283, 2162, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:03:35', '2026-04-13 07:03:35'),
(1284, 2163, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:03:35', '2026-04-13 07:03:35'),
(1285, 2164, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:04:09', '2026-04-13 07:04:09'),
(1286, 2165, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:04:09', '2026-04-13 07:04:09'),
(1287, 2334, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:25:13', '2026-04-13 07:25:13'),
(1288, 2335, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 10:25:13', '2026-04-13 07:25:13'),
(1289, 2546, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 20:01:38', '2026-04-13 17:01:38'),
(1290, 2547, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 20:01:38', '2026-04-13 17:01:38'),
(1291, 2548, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 20:02:50', '2026-04-13 17:02:50'),
(1292, 2549, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-13 20:02:50', '2026-04-13 17:02:50'),
(1293, 2550, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 09:09:01', '2026-04-14 06:09:01'),
(1294, 2551, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 09:09:01', '2026-04-14 06:09:01'),
(1295, 2552, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 09:19:51', '2026-04-14 06:19:51'),
(1296, 2553, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 09:19:51', '2026-04-14 06:19:51'),
(1297, 2554, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1298, 2554, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1299, 2555, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1300, 2555, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1301, 2556, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1302, 2556, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1303, 2557, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1304, 2557, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1305, 2558, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1306, 2558, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1307, 2559, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1308, 2559, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:15'),
(1309, 2560, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1310, 2560, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:25'),
(1311, 2561, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1312, 2561, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:25'),
(1313, 2562, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1314, 2562, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:35'),
(1315, 2563, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1316, 2563, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:35'),
(1317, 2564, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1318, 2564, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:35'),
(1319, 2565, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1320, 2565, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:35'),
(1321, 2566, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1322, 2566, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:45'),
(1323, 2567, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1324, 2567, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1325, 2568, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1326, 2568, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1327, 2569, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1328, 2569, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1329, 2570, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1330, 2570, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1331, 2571, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1332, 2571, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1333, 2572, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1334, 2572, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1335, 2573, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1336, 2573, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:46'),
(1337, 2574, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1338, 2574, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:56'),
(1339, 2575, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14');
INSERT INTO `notificacoes_envios` (`id`, `notificacao_id`, `canal`, `destino`, `status`, `resposta`, `tentativas`, `created_at`, `sent_at`) VALUES
(1340, 2575, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:56'),
(1341, 2576, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1342, 2576, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:56'),
(1343, 2577, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1344, 2577, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:56'),
(1345, 2578, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1346, 2578, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:57'),
(1347, 2579, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1348, 2579, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:56:57'),
(1349, 2580, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1350, 2580, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1351, 2581, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1352, 2581, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1353, 2582, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1354, 2582, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1355, 2583, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1356, 2583, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1357, 2584, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1358, 2584, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1359, 2585, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1360, 2585, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1361, 2586, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1362, 2586, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:07'),
(1363, 2587, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1364, 2587, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:17'),
(1365, 2588, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1366, 2588, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:17'),
(1367, 2589, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1368, 2589, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:17'),
(1369, 2590, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1370, 2590, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:17'),
(1371, 2591, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1372, 2591, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:17'),
(1373, 2592, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1374, 2592, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:27'),
(1375, 2593, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1376, 2593, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:28'),
(1377, 2594, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1378, 2594, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:28'),
(1379, 2595, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1380, 2595, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:28'),
(1381, 2596, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1382, 2596, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:28'),
(1383, 2597, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1384, 2597, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:38'),
(1385, 2598, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1386, 2598, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:48'),
(1387, 2599, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1388, 2599, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:48'),
(1389, 2600, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1390, 2600, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:58'),
(1391, 2601, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1392, 2601, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:58'),
(1393, 2602, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1394, 2602, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:57:58'),
(1395, 2603, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 10:56:14', '2026-04-14 07:56:14'),
(1396, 2603, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-14 10:56:14', '2026-04-14 07:58:08'),
(1397, 2804, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:00:15', '2026-04-14 17:00:15'),
(1398, 2805, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:00:15', '2026-04-14 17:00:15'),
(1399, 2806, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:00:52', '2026-04-14 17:00:52'),
(1400, 2807, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:00:52', '2026-04-14 17:00:52'),
(1401, 2808, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:01:07', '2026-04-14 17:01:07'),
(1402, 2809, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:01:07', '2026-04-14 17:01:07'),
(1403, 2810, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:01:07', '2026-04-14 17:01:07'),
(1404, 2811, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-14 20:01:07', '2026-04-14 17:01:07'),
(1405, 2812, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 09:07:23', '2026-04-15 06:07:23'),
(1406, 2813, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 09:07:23', '2026-04-15 06:07:23'),
(1407, 2814, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1408, 2814, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1409, 2815, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1410, 2815, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1411, 2816, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1412, 2816, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1413, 2817, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1414, 2817, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1415, 2818, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1416, 2818, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1417, 2819, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1418, 2819, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1419, 2820, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1420, 2820, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1421, 2821, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1422, 2821, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:29'),
(1423, 2822, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1424, 2822, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:30'),
(1425, 2823, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1426, 2823, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:40'),
(1427, 2824, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1428, 2824, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:16:40'),
(1429, 2825, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1430, 2825, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:00'),
(1431, 2826, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1432, 2826, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:00'),
(1433, 2827, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1434, 2827, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:00'),
(1435, 2828, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1436, 2828, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:00'),
(1437, 2829, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1438, 2829, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:10'),
(1439, 2830, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1440, 2830, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:10'),
(1441, 2831, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1442, 2831, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:10'),
(1443, 2832, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1444, 2832, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:20'),
(1445, 2833, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1446, 2833, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:20'),
(1447, 2834, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1448, 2834, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:20'),
(1449, 2835, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1450, 2835, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:30'),
(1451, 2836, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1452, 2836, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:30'),
(1453, 2837, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1454, 2837, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:31'),
(1455, 2838, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1456, 2838, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:31'),
(1457, 2839, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1458, 2839, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:31'),
(1459, 2840, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1460, 2840, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:31'),
(1461, 2841, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1462, 2841, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1463, 2842, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1464, 2842, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1465, 2843, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1466, 2843, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1467, 2844, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1468, 2844, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1469, 2845, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1470, 2845, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1471, 2846, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1472, 2846, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1473, 2847, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1474, 2847, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1475, 2848, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1476, 2848, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:41'),
(1477, 2849, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1478, 2849, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:42'),
(1479, 2850, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1480, 2850, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:52'),
(1481, 2851, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1482, 2851, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:52'),
(1483, 2852, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1484, 2852, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:52'),
(1485, 2853, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1486, 2853, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:28', '2026-04-15 07:17:52'),
(1487, 2854, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:28', '2026-04-15 07:16:28'),
(1488, 2854, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:17:52'),
(1489, 2855, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1490, 2855, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:17:52'),
(1491, 2856, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1492, 2856, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:02'),
(1493, 2857, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1494, 2857, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:02'),
(1495, 2858, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1496, 2858, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:02'),
(1497, 2859, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1498, 2859, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:12'),
(1499, 2860, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1500, 2860, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:12'),
(1501, 2861, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1502, 2861, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:12'),
(1503, 2862, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1504, 2862, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:12'),
(1505, 2863, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1506, 2863, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:12'),
(1507, 2864, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1508, 2864, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:22'),
(1509, 2865, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1510, 2865, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:32'),
(1511, 2866, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1512, 2866, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:33'),
(1513, 2867, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1514, 2867, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:33'),
(1515, 2868, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1516, 2868, 'email', 'admin@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:33'),
(1517, 2869, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1518, 2869, 'email', 'jose@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:33'),
(1519, 2870, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1520, 2870, 'email', 'projetista@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:33'),
(1521, 2871, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1522, 2871, 'email', 'admin2@sistema.com', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:43'),
(1523, 2872, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 10:16:29', '2026-04-15 07:16:29'),
(1524, 2872, 'email', 'Marcos@cozinca.com.br', 'ENVIADO', 'Email enviado', 1, '2026-04-15 10:16:29', '2026-04-15 07:18:43'),
(1525, 2932, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 12:22:07', '2026-04-15 09:22:07'),
(1526, 2933, 'interno', NULL, 'ENVIADO', 'Disponível no painel interno', 0, '2026-04-15 12:22:07', '2026-04-15 09:22:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `orcamentos`
--

CREATE TABLE `orcamentos` (
  `id` int(11) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_orcamento` date NOT NULL,
  `validade` date DEFAULT NULL,
  `valor_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `desconto` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('pendente','aprovado','convertido','cancelado') DEFAULT 'pendente',
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `orcamentos`
--

INSERT INTO `orcamentos` (`id`, `numero`, `cliente_id`, `usuario_id`, `data_orcamento`, `validade`, `valor_total`, `desconto`, `status`, `observacoes`, `created_at`, `updated_at`) VALUES
(28, 'ORC-0001', 21, 6, '2026-03-10', NULL, 4456.00, 0.00, 'pendente', '', '2026-03-10 14:45:06', '2026-03-10 14:45:06');

-- --------------------------------------------------------

--
-- Estrutura para tabela `orcamentos_itens`
--

CREATE TABLE `orcamentos_itens` (
  `id` int(11) NOT NULL,
  `orcamento_id` int(11) NOT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `descricao_manual` varchar(255) DEFAULT NULL,
  `unidade` varchar(50) DEFAULT 'un',
  `foto` text DEFAULT NULL,
  `descricao_completa` text DEFAULT NULL,
  `quantidade` decimal(15,2) NOT NULL DEFAULT 1.00,
  `valor_unitario` decimal(15,2) NOT NULL DEFAULT 0.00,
  `valor_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `orcamentos_itens`
--

INSERT INTO `orcamentos_itens` (`id`, `orcamento_id`, `produto_id`, `descricao_manual`, `unidade`, `foto`, `descricao_completa`, `quantidade`, `valor_unitario`, `valor_total`, `created_at`) VALUES
(19, 28, NULL, 'dfgd', 'un', 'data:image/png;base64,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', 'dfgdfdg', 1.00, 4456.00, 4456.00, '2026-03-10 14:45:06');

-- --------------------------------------------------------

--
-- Estrutura para tabela `ordens_servico`
--

CREATE TABLE `ordens_servico` (
  `id` int(11) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `venda_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `data_inicio` date NOT NULL,
  `data_termino` date DEFAULT NULL,
  `prioridade` enum('verde','amarelo','vermelho') DEFAULT 'verde',
  `status` enum('pendente','em_projeto','em_revisao','em_producao','concluida','cancelada') DEFAULT 'pendente',
  `etapa_atual` enum('autorizacao','corte','dobra','solda','refrigeracao','acabamento','finalizacao','montagem','concluida') DEFAULT 'autorizacao',
  `observacoes_gerais` text DEFAULT NULL,
  `observacoes_corte_dobra` text DEFAULT NULL,
  `observacoes_solda` text DEFAULT NULL,
  `arquivo_projeto` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `ordens_servico`
--

INSERT INTO `ordens_servico` (`id`, `numero`, `venda_id`, `cliente_id`, `data_inicio`, `data_termino`, `prioridade`, `status`, `etapa_atual`, `observacoes_gerais`, `observacoes_corte_dobra`, `observacoes_solda`, `arquivo_projeto`, `created_at`, `updated_at`) VALUES
(39, 'OS-0001', 39, 20, '2026-03-04', '2026-03-20', 'verde', 'cancelada', 'concluida', NULL, NULL, NULL, NULL, '2026-03-05 08:46:49', '2026-04-06 08:47:02'),
(40, 'OS-0002', 42, 21, '2026-03-05', '2026-03-23', 'verde', 'cancelada', 'concluida', NULL, NULL, NULL, NULL, '2026-03-05 09:57:31', '2026-04-06 08:46:51'),
(41, 'OS-0003', 43, 22, '2026-03-05', '2026-04-03', 'verde', 'cancelada', 'autorizacao', '', NULL, NULL, NULL, '2026-03-05 13:47:14', '2026-03-26 09:13:36'),
(42, 'OS-0004', 44, 23, '2026-03-05', '2026-03-26', 'verde', 'cancelada', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-05 14:05:25', '2026-03-28 12:32:48'),
(43, 'OS-0005', 45, 24, '2026-03-06', '2026-04-06', 'verde', 'em_producao', 'solda', NULL, 'projeto de cada um separado por nome.', 'Fazer solda padrao fifa', NULL, '2026-03-06 15:55:35', '2026-03-28 14:35:44'),
(44, 'OS-0006', 46, 21, '2026-03-08', '2026-03-20', 'verde', 'concluida', 'concluida', NULL, '', '', NULL, '2026-03-08 04:54:04', '2026-03-30 09:09:18'),
(45, 'OS-0007', 47, 22, '2026-03-08', '2026-03-16', 'verde', 'concluida', 'concluida', NULL, '', '', NULL, '2026-03-08 04:55:55', '2026-03-30 09:08:48'),
(46, 'OS-0008', 48, 25, '2026-03-10', '2026-03-13', 'verde', 'concluida', 'concluida', NULL, '', '', NULL, '2026-03-10 14:43:56', '2026-03-30 09:09:24'),
(47, 'OS-0009', 49, 26, '2026-03-12', NULL, 'verde', 'em_revisao', 'autorizacao', NULL, '', '', NULL, '2026-03-12 12:35:01', '2026-03-31 11:39:25'),
(48, 'OS-0010', 50, 29, '2026-03-11', '2026-04-27', 'verde', 'em_producao', 'solda', NULL, '', '', NULL, '2026-03-12 12:55:21', '2026-04-15 13:10:12'),
(49, 'OS-0011', 51, 30, '2026-03-12', '2026-03-13', 'verde', 'em_revisao', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-12 12:59:10', '2026-03-12 12:59:10'),
(50, 'OS-0012', 52, 31, '2026-03-14', NULL, 'verde', 'cancelada', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-14 14:02:55', '2026-03-26 09:14:28'),
(51, 'OS-0013', 53, 33, '2026-03-17', '2026-05-05', 'verde', 'em_revisao', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-17 11:28:18', '2026-03-17 11:28:18'),
(52, 'OS-0014', 54, 34, '2026-03-18', '2026-05-04', 'verde', 'em_revisao', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-19 11:22:44', '2026-03-19 11:22:44'),
(53, 'OS-0015', 55, 35, '2026-03-19', '2026-05-06', 'verde', 'em_revisao', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-19 17:43:48', '2026-03-19 17:43:48'),
(54, 'OS-0016', 56, 36, '2026-03-24', '2026-04-09', 'verde', 'cancelada', 'autorizacao', NULL, '', '', NULL, '2026-03-24 22:25:17', '2026-04-06 08:39:44'),
(55, 'OS-0017', 57, 37, '2026-03-24', NULL, 'amarelo', 'em_producao', 'solda', NULL, 'Bancada modelo Padrão. Acompanha languarinas e perfis.', 'Paneleiros à 150 acima do piso.', NULL, '2026-03-24 22:41:43', '2026-04-10 13:15:14'),
(56, 'OS-0018', 58, 38, '2026-03-23', '2026-04-23', 'verde', 'em_revisao', 'autorizacao', NULL, '', '', NULL, '2026-03-24 22:56:26', '2026-03-31 11:39:33'),
(57, 'OS-0019', 59, 39, '2026-03-23', '2026-03-30', 'vermelho', 'em_producao', 'finalizacao', NULL, '', '', NULL, '2026-03-30 08:51:39', '2026-04-10 10:55:56'),
(58, 'OS-0020', 60, 40, '2026-03-30', '2026-03-30', 'vermelho', 'concluida', 'concluida', NULL, NULL, NULL, NULL, '2026-03-30 16:27:26', '2026-03-31 11:30:25'),
(59, 'OS-0021', 61, 41, '2026-03-31', '2026-03-26', 'vermelho', 'cancelada', 'solda', NULL, '2 unidades. Chapa 0,60 ou 0,80 201 esc. \r\nGuilherme que enviou', '', NULL, '2026-03-31 12:23:50', '2026-04-06 08:38:43'),
(60, 'OS-0022', 62, 41, '2026-03-31', '2026-04-01', 'vermelho', 'cancelada', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-31 12:55:32', '2026-04-06 08:38:38'),
(61, 'OS-0023', 63, 42, '2026-03-31', NULL, 'amarelo', 'cancelada', 'autorizacao', NULL, NULL, NULL, NULL, '2026-03-31 13:31:13', '2026-03-31 13:36:38'),
(62, 'OS-0024', 64, 42, '2026-03-30', '2026-04-13', 'verde', 'em_revisao', 'autorizacao', NULL, 'BASE REFRIGERADA SEM RODOBANCA', 'BASE REFRIGERADA SEM RODOBANCA', NULL, '2026-03-31 13:42:03', '2026-03-31 14:29:25'),
(63, 'OS-0025', 65, 36, '2026-03-24', '2026-04-09', 'verde', 'em_producao', 'solda', NULL, '', '', NULL, '2026-04-06 08:46:07', '2026-04-14 10:21:51'),
(64, 'OS-0026', 66, 38, '2026-03-24', '2026-04-23', 'verde', 'em_projeto', 'autorizacao', NULL, NULL, NULL, NULL, '2026-04-06 09:21:32', '2026-04-15 18:01:13'),
(65, 'OS-0027', 67, 37, '2026-04-03', '2026-04-09', 'amarelo', 'em_producao', 'finalizacao', NULL, '', '', NULL, '2026-04-06 10:18:28', '2026-04-10 10:56:24'),
(66, 'OS-0028', 68, 26, '2026-03-06', '2026-04-24', 'verde', 'em_producao', 'solda', NULL, '', '', NULL, '2026-04-06 10:40:30', '2026-04-13 19:51:21'),
(67, 'OS-0029', 69, 29, '2026-03-11', '2026-04-27', 'verde', 'em_producao', 'solda', NULL, '', '', NULL, '2026-04-06 10:42:31', '2026-04-14 10:31:04'),
(68, 'OS-0030', 70, 33, '2026-03-16', '2026-05-04', 'verde', 'em_producao', 'solda', NULL, '', '', NULL, '2026-04-06 10:47:40', '2026-04-08 12:13:11'),
(69, 'OS-0031', 71, 34, '2026-03-18', '2026-05-04', 'verde', 'em_producao', 'dobra', NULL, '', '', NULL, '2026-04-06 10:50:43', '2026-04-07 13:03:52'),
(70, 'OS-0032', 72, 35, '2026-03-19', '2026-05-06', 'verde', 'em_producao', 'dobra', NULL, '', '', NULL, '2026-04-06 10:53:28', '2026-04-07 13:11:43'),
(71, 'OS-0033', 73, 43, '2026-04-06', '2026-04-09', 'verde', 'em_producao', 'solda', NULL, NULL, NULL, NULL, '2026-04-08 07:16:47', '2026-04-10 10:57:56'),
(72, 'OS-I0001', NULL, 44, '2026-04-08', '2026-04-09', 'vermelho', 'em_producao', 'finalizacao', '', '', '', NULL, '2026-04-08 17:50:41', '2026-04-10 10:56:05'),
(73, 'OS-I0002', NULL, 45, '2026-04-08', NULL, 'vermelho', 'em_producao', 'solda', '', '', '', NULL, '2026-04-08 17:54:43', '2026-04-13 17:55:12'),
(74, 'OS-I0003', NULL, 46, '2026-04-08', '2026-04-08', 'vermelho', 'em_producao', 'finalizacao', '', '', '', NULL, '2026-04-08 18:37:19', '2026-04-09 11:27:53'),
(75, 'OS-0034', 74, 47, '2026-04-09', NULL, 'amarelo', 'em_producao', 'corte', NULL, '', '', NULL, '2026-04-09 09:47:41', '2026-04-15 17:36:30'),
(76, 'OS-I0004', NULL, 49, '2026-04-13', '2026-04-13', 'amarelo', 'em_producao', 'solda', '', 'Projeto existente de balcóes do Guilherme.', '', NULL, '2026-04-13 10:28:03', '2026-04-14 10:17:41'),
(77, 'OS-0035', 75, 50, '2026-03-09', '2026-04-24', 'verde', 'em_producao', 'montagem', NULL, NULL, NULL, NULL, '2026-04-14 13:13:08', '2026-04-14 14:41:35'),
(78, 'OS-0036', 76, 51, '2026-03-19', '2026-05-06', 'verde', 'em_producao', 'corte', NULL, NULL, NULL, NULL, '2026-04-14 13:16:02', '2026-04-14 13:16:02'),
(79, 'OS-0037', 77, 52, '2026-02-05', '2026-03-23', 'verde', 'concluida', 'concluida', NULL, NULL, NULL, NULL, '2026-04-14 13:18:28', '2026-04-15 12:22:30'),
(80, 'OS-0038', 78, 53, '2026-04-14', '2026-05-11', 'verde', 'em_projeto', 'autorizacao', NULL, NULL, NULL, NULL, '2026-04-14 20:01:07', '2026-04-15 19:38:23'),
(81, 'OS-0039', 79, 54, '2026-04-10', '2026-05-15', 'verde', 'cancelada', 'corte', NULL, NULL, NULL, NULL, '2026-04-15 10:34:34', '2026-04-15 11:39:50'),
(82, 'OS-0040', 80, 55, '2026-04-14', '2026-05-19', 'verde', 'em_producao', 'corte', NULL, NULL, NULL, NULL, '2026-04-15 10:38:47', '2026-04-15 10:38:47'),
(83, 'OS-0041', 81, 56, '2026-04-14', '2026-05-14', 'verde', 'em_producao', 'corte', NULL, NULL, NULL, NULL, '2026-04-15 10:44:43', '2026-04-15 10:44:43'),
(84, 'OS-0042', 82, 56, '2026-04-14', '2026-05-15', 'verde', 'em_producao', 'corte', NULL, NULL, NULL, NULL, '2026-04-15 10:47:59', '2026-04-15 10:47:59'),
(85, 'OS-0043', 83, 54, '2026-04-10', '2026-05-15', 'verde', 'em_producao', 'dobra', NULL, NULL, NULL, NULL, '2026-04-15 11:53:33', '2026-04-15 15:01:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_arquivos`
--

CREATE TABLE `os_arquivos` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `tipo` enum('venda','projeto','producao','outros') NOT NULL,
  `nome_original` varchar(255) NOT NULL,
  `nome_arquivo` varchar(255) NOT NULL,
  `descricao` text DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `os_arquivos`
--

INSERT INTO `os_arquivos` (`id`, `os_id`, `tipo`, `nome_original`, `nome_arquivo`, `descricao`, `usuario_id`, `created_at`) VALUES
(18, 42, 'venda', 'WhatsApp Image 2026-03-05 at 10.20.09.jpeg', '69a98da57441a_1772719525.jpeg', NULL, 18, '2026-03-05 14:05:25'),
(19, 43, 'projeto', 'Conservador SF50.dxf', '69ac05b2b177d_1772881330.dxf', NULL, 5, '2026-03-07 11:02:10'),
(20, 43, 'projeto', 'Conservador frituras - CORPO.dxf', '69ac05b2d29f8_1772881330.dxf', NULL, 5, '2026-03-07 11:02:10'),
(21, 43, 'projeto', 'Fechamento - CABEÇOTE.dxf', '69ac05b2d3f75_1772881330.dxf', NULL, 5, '2026-03-07 11:02:10'),
(22, 46, 'venda', 'Captura de tela 2025-10-03 093641.png', '69b02e2c444f6_1773153836.png', NULL, 6, '2026-03-10 14:43:56'),
(23, 46, 'venda', 'Captura de tela 2025-10-03 094030.png', '69b02e2c48638_1773153836.png', NULL, 6, '2026-03-10 14:43:56'),
(24, 48, 'venda', 'WhatsApp Image 2025-09-22 at 16.28.24 (1).jpg', '69b2b7b97b77f_1773320121.jpg', NULL, 6, '2026-03-12 12:55:21'),
(25, 49, 'venda', 'WhatsApp Image 2025-10-24 at 10.02.51 (2).jpg', '69b2b89eb2d0c_1773320350.jpg', NULL, 6, '2026-03-12 12:59:10'),
(26, 51, 'venda', 'WhatsApp Image 2025-09-22 at 16.28.24 (1).jpg', '69b93ad2a4426_1773746898.jpg', NULL, 6, '2026-03-17 11:28:18'),
(27, 52, 'venda', 'WhatsApp Image 2025-10-06 at 16.19.13 - BURGUER HOUSE GRILL LTDA.jpg', '69bbdc842bc0c_1773919364.jpg', NULL, 6, '2026-03-19 11:22:44'),
(28, 54, 'venda', 'WhatsApp Image 2026-03-24 at 19.22.56.jpeg', '69c30f4dcdee4_1774391117.jpeg', NULL, 18, '2026-03-24 22:25:17'),
(29, 54, 'venda', 'WhatsApp Image 2026-03-24 at 19.22.55.jpeg', '69c30f4dcf58a_1774391117.jpeg', NULL, 18, '2026-03-24 22:25:17'),
(30, 56, 'venda', 'PHOTO-2026-03-12-14-19-10.jpg', '69c3169a7241f_1774392986.jpg', NULL, 18, '2026-03-24 22:56:26'),
(31, 55, 'projeto', 'Prateleira 190x25 Perfurada.dxf', '69c7c9ff77105_1774701055.dxf', NULL, 5, '2026-03-28 12:30:55'),
(32, 46, 'projeto', 'Prateleira 190x25 Perfurada.dxf', '69c7cea343eca_1774702243.dxf', NULL, 5, '2026-03-28 12:50:43'),
(33, 46, 'projeto', 'Prateleira 77x30.dxf', '69c7cea345933_1774702243.dxf', NULL, 5, '2026-03-28 12:50:43'),
(34, 46, 'projeto', '1200X820X900.dxf', '69c7cea346c2d_1774702243.dxf', NULL, 5, '2026-03-28 12:50:43'),
(35, 45, 'projeto', 'Prateleira 77x30.dxf', '69c7cf3319f68_1774702387.dxf', NULL, 5, '2026-03-28 12:53:07'),
(36, 45, 'projeto', '1200X820X900.dxf', '69c7cf331b3e8_1774702387.dxf', NULL, 5, '2026-03-28 12:53:07'),
(37, 45, 'projeto', 'Prateleira 190x25 Perfurada.dxf', '69c7cf331c803_1774702387.dxf', NULL, 5, '2026-03-28 12:53:07'),
(38, 57, 'venda', 'WhatsApp Image 2026-03-30 at 05.46.33.jpeg', '69ca399bf0927_1774860699.jpeg', NULL, 18, '2026-03-30 08:51:39'),
(39, 58, 'venda', 'WhatsApp Image 2026-03-30 at 12.22.49.jpeg', '69caa46ed8dac_1774888046.jpeg', NULL, 18, '2026-03-30 16:27:26'),
(40, 47, 'projeto', '8197225.pdf.crdownload', '69cbb26dac7c2_1774957165.crdownload', NULL, 5, '2026-03-31 11:39:25'),
(41, 59, 'projeto', 'TURVO PRATELEIRASai.dxf', '69cbbd4a87b9a_1774959946.dxf', NULL, 5, '2026-03-31 12:25:46'),
(42, 60, 'venda', 'WhatsApp Image 2026-03-31 at 09.52.45 (1).jpeg', '69cbc44452e19_1774961732.jpeg', NULL, 18, '2026-03-31 12:55:32'),
(43, 60, 'venda', 'WhatsApp Image 2026-03-31 at 09.52.45.jpeg', '69cbc44457ce2_1774961732.jpeg', NULL, 18, '2026-03-31 12:55:32'),
(44, 60, 'venda', 'WhatsApp Image 2026-03-31 at 09.52.44.jpeg', '69cbc444598bd_1774961732.jpeg', NULL, 18, '2026-03-31 12:55:32'),
(45, 62, 'projeto', 'WhatsApp Image 2026-03-31 at 11.27.07 (2).jpeg', '69cbda45d1b71_1774967365.jpeg', NULL, 5, '2026-03-31 14:29:25'),
(46, 62, 'projeto', 'WhatsApp Image 2026-03-31 at 11.27.07 (1).jpeg', '69cbda45d402b_1774967365.jpeg', NULL, 5, '2026-03-31 14:29:25'),
(47, 62, 'projeto', 'WhatsApp Image 2026-03-31 at 11.27.07.jpeg', '69cbda45d5526_1774967365.jpeg', NULL, 5, '2026-03-31 14:29:25'),
(48, 63, 'venda', '69c30f4dcf58a_1774391117.jpeg', '69d372cfe8406_1775465167.jpeg', NULL, 18, '2026-04-06 08:46:07'),
(49, 63, 'venda', '69c30f4dcdee4_1774391117.jpeg', '69d372cfe99cd_1775465167.jpeg', NULL, 18, '2026-04-06 08:46:07'),
(50, 65, 'venda', 'Captura de Tela 2026-04-06 às 07.15.49.png', '69d388748faf1_1775470708.png', NULL, 18, '2026-04-06 10:18:28'),
(51, 65, 'venda', 'Captura de Tela 2026-04-06 às 07.15.42.png', '69d3887491361_1775470708.png', NULL, 18, '2026-04-06 10:18:28'),
(52, 65, 'venda', 'Captura de Tela 2026-04-06 às 07.15.33.png', '69d388749277c_1775470708.png', NULL, 18, '2026-04-06 10:18:28'),
(53, 68, 'venda', 'WhatsApp Image 2025-09-22 at 16.28.24 (1).jpg', '69d38f4c08f55_1775472460.jpg', NULL, 6, '2026-04-06 10:47:40'),
(54, 69, 'venda', 'WhatsApp Image 2025-10-06 at 16.19.13 - BURGUER HOUSE GRILL LTDA.jpg', '69d39003d2406_1775472643.jpg', NULL, 6, '2026-04-06 10:50:43'),
(55, 65, 'projeto', '1x_CZI-32107-PC01.dxf', '69d4e5414a552_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(56, 65, 'projeto', '1x_CZI-32107-PC02.dxf', '69d4e5414c2f0_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(57, 65, 'projeto', '1x_CZI-32107-PC05.dxf', '69d4e5414d599_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(58, 65, 'projeto', '1x_CZI-32107-PC06.dxf', '69d4e5414e53a_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(59, 65, 'projeto', '1x_CZI-32108-PC01.dxf', '69d4e5414fb2e_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(60, 65, 'projeto', '1x_CZI-32110-PC01.dxf', '69d4e54151256_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(61, 65, 'projeto', '1x_CZI-32110-PC02.dxf', '69d4e541527d1_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(62, 65, 'projeto', '1x_CZI-32110-PC03.dxf', '69d4e54153ade_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(63, 65, 'projeto', '1x_CZI-32110-PC05.dxf', '69d4e541559a6_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(64, 65, 'projeto', '1x_CZI-32110-PC06.dxf', '69d4e54156bbe_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(65, 65, 'projeto', '1x_LISA-ME-2000X600-PC01.DXF', '69d4e54157e74_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(66, 65, 'projeto', '1xLISA-ME-2000X600-PC02.DXF', '69d4e54159f11_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(67, 65, 'projeto', '2x_CZI-32107-PC03.dxf', '69d4e5415c83b_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(68, 65, 'projeto', '2x_CZI-32111-PC01.dxf', '69d4e5415dad7_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(69, 65, 'projeto', '2x_LISA-ME-1550X600-PC01.dxf', '69d4e5415f015_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(70, 65, 'projeto', '2x_LISA-ME-1550X600-PC02.dxf', '69d4e54160522_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(71, 65, 'projeto', '3x_CZI-32109-PC01.dxf', '69d4e54161dc0_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(72, 65, 'projeto', '3x_CZI-32110-PC04.dxf', '69d4e54162fd7_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(73, 65, 'projeto', '3x_MF-350-PC03.dxf', '69d4e5416436e_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(74, 65, 'projeto', '4x_MF-200-PC02.dxf', '69d4e54165764_1775560001.dxf', NULL, 5, '2026-04-07 11:06:41'),
(75, 71, 'venda', 'Captura de Tela 2026-04-08 às 04.15.50.png', '69d600dfea5ff_1775632607.png', NULL, 18, '2026-04-08 07:16:48'),
(76, 71, 'venda', 'Captura de Tela 2026-04-08 às 04.15.32.png', '69d600e0068c4_1775632608.png', NULL, 18, '2026-04-08 07:16:48'),
(77, 71, 'venda', 'Captura de Tela 2026-04-08 às 04.14.47.png', '69d600e00c51e_1775632608.png', NULL, 18, '2026-04-08 07:16:48'),
(78, 71, 'venda', 'Captura de Tela 2026-04-08 às 04.14.34.png', '69d600e0130f6_1775632608.png', NULL, 18, '2026-04-08 07:16:48'),
(79, 72, 'venda', 'b38713cc-6a61-4bd2-955a-972acaf63e5d.jpeg', '69d6957128b5b_1775670641.jpeg', NULL, 16, '2026-04-08 17:50:41'),
(80, 73, 'venda', 'IMG_5219.jpeg', '69d696636d8bc_1775670883.jpeg', NULL, 16, '2026-04-08 17:54:43'),
(81, 75, 'venda', 'WhatsApp Image 2026-04-01 at 15.19.07 (1).jpeg', '69d775bd1d33d_1775728061.jpeg', NULL, 18, '2026-04-09 09:47:41'),
(82, 75, 'venda', 'WhatsApp Image 2026-04-01 at 15.19.07.jpeg', '69d775bd208ca_1775728061.jpeg', NULL, 18, '2026-04-09 09:47:41'),
(83, 75, 'venda', 'WhatsApp Image 2026-04-09 at 06.46.37.jpeg', '69d775bd238c6_1775728061.jpeg', NULL, 18, '2026-04-09 09:47:41'),
(84, 77, 'venda', 'WhatsApp Image 2025-10-07 at 16.55.57 (1).jpg', '69de3d64af6e3_1776172388.jpg', NULL, 6, '2026-04-14 13:13:08'),
(85, 82, 'venda', 'WhatsApp Image 2026-04-14 at 13.45.30 - Mesa Dauto FINALIZADA.jpeg', '69df6ab753349_1776249527.jpeg', NULL, 6, '2026-04-15 10:38:47'),
(86, 83, 'venda', 'WhatsApp Image 2025-10-24 at 10.02.51 (1).jpg', '69df6c1b7481c_1776249883.jpg', NULL, 6, '2026-04-15 10:44:43'),
(87, 84, 'venda', 'Doc1.pdf', '69df6cdf5ff20_1776250079.pdf', NULL, 6, '2026-04-15 10:47:59'),
(88, 85, 'venda', 'WhatsApp Image 2025-08-21 at 12.30.48.jpg', '69df7c3d42e71_1776254013.jpg', NULL, 6, '2026-04-15 11:53:33'),
(89, 85, 'venda', 'WhatsApp Image 2025-10-07 at 17.02.41.jpg', '69df7c3d453bf_1776254013.jpg', NULL, 6, '2026-04-15 11:53:33'),
(90, 85, 'venda', 'WhatsApp Image 2025-10-24 at 10.02.51 (1).jpg', '69df7c3d4667e_1776254013.jpg', NULL, 6, '2026-04-15 11:53:33'),
(91, 85, 'venda', 'WhatsApp Image 2025-11-07 at 10.43.25 (3).jpg', '69df7c3d48997_1776254013.jpg', NULL, 6, '2026-04-15 11:53:33'),
(92, 85, 'venda', 'WhatsApp Image 2026-04-10 at 08.50.01 - Vinícius CORRETA.jpeg', '69df7c3d4c12d_1776254013.jpeg', NULL, 6, '2026-04-15 11:53:33'),
(93, 75, 'projeto', 'CZI-32113.pdf', '69dfac21b0b46_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(94, 75, 'projeto', 'CZI-32113-M01.pdf', '69dfac21b3b12_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(95, 75, 'projeto', 'CZI-32113-M02.pdf', '69dfac21b5aaa_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(96, 75, 'projeto', 'CZI-32113-M03.pdf', '69dfac21b7334_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(97, 75, 'projeto', 'CZI-32114.pdf', '69dfac21bba0f_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(98, 75, 'projeto', 'CZI-32114-M01.pdf', '69dfac21bd3f4_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(99, 75, 'projeto', 'CZI-32115.pdf', '69dfac21bea41_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(100, 75, 'projeto', 'CZI-32115-M01.pdf', '69dfac21c0bd9_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(101, 75, 'projeto', 'CZI-32115-M02.pdf', '69dfac21c2226_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(102, 75, 'projeto', 'CZI-32115-M03.pdf', '69dfac21c3562_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(103, 75, 'projeto', 'CZI-32115-M04.pdf', '69dfac21c4c67_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(104, 75, 'projeto', 'CZI-32115-M05.pdf', '69dfac21c5f61_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53'),
(105, 75, 'projeto', 'CZI-32115-M06.pdf', '69dfac21c751b_1776266273.pdf', NULL, 5, '2026-04-15 15:17:53');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_checkup_qualidade`
--

CREATE TABLE `os_checkup_qualidade` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `venda_item_id` int(11) NOT NULL,
  `conferir_acabamento` tinyint(1) DEFAULT 0,
  `conferir_solda` tinyint(1) DEFAULT 0,
  `conferir_dobra` tinyint(1) DEFAULT 0,
  `conferir_projeto` tinyint(1) DEFAULT 0,
  `conferir_funcionalidade` tinyint(1) DEFAULT 0,
  `observacoes` text DEFAULT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_etapas_producao`
--

CREATE TABLE `os_etapas_producao` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `etapa` enum('corte','dobra','solda','refrigeracao','acabamento','finalizacao','montagem') NOT NULL,
  `status` enum('pendente','em_andamento','concluida') DEFAULT 'pendente',
  `data_inicio` datetime DEFAULT NULL,
  `data_fim` datetime DEFAULT NULL,
  `tempo_total_segundos` int(11) DEFAULT 0,
  `usuario_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `os_etapas_producao`
--

INSERT INTO `os_etapas_producao` (`id`, `os_id`, `etapa`, `status`, `data_inicio`, `data_fim`, `tempo_total_segundos`, `usuario_id`) VALUES
(97, 43, 'corte', 'concluida', '2026-03-07 08:05:58', '2026-03-17 08:44:16', 866298, 17),
(98, 52, 'corte', 'pendente', NULL, NULL, 0, NULL),
(99, 52, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(100, 52, 'solda', 'pendente', NULL, NULL, 0, NULL),
(101, 52, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(102, 52, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(103, 52, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(104, 53, 'corte', 'pendente', NULL, NULL, 0, NULL),
(105, 53, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(106, 53, 'solda', 'pendente', NULL, NULL, 0, NULL),
(107, 53, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(108, 53, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(109, 53, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(110, 54, 'corte', 'pendente', NULL, NULL, 0, NULL),
(111, 54, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(112, 54, 'solda', 'pendente', NULL, NULL, 0, NULL),
(113, 54, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(114, 54, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(115, 54, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(116, 55, 'corte', 'concluida', '2026-04-10 10:15:03', '2026-04-10 10:15:14', 22, 17),
(117, 55, 'dobra', 'concluida', '2026-03-31 07:09:11', '2026-03-31 07:09:20', 9, 8),
(119, 55, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(120, 55, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(121, 55, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(122, 56, 'corte', 'pendente', NULL, NULL, 0, NULL),
(123, 56, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(124, 56, 'solda', 'pendente', NULL, NULL, 0, NULL),
(125, 56, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(126, 56, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(127, 56, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(128, 45, 'corte', 'concluida', '2026-03-30 06:01:46', '2026-03-30 06:07:20', 331, 7),
(129, 45, 'dobra', 'concluida', '2026-03-28 11:36:11', '2026-03-30 06:08:48', 0, 8),
(130, 45, 'solda', 'pendente', NULL, NULL, 0, NULL),
(131, 45, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(132, 45, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(133, 45, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(134, 43, 'dobra', 'concluida', '2026-03-28 09:58:36', '2026-03-28 11:35:44', 5828, 8),
(135, 39, 'corte', 'concluida', '2026-03-30 06:01:42', '2026-03-30 06:02:13', 31, 7),
(136, 39, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(137, 39, 'solda', 'pendente', NULL, NULL, 0, NULL),
(138, 39, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(139, 39, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(140, 39, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(141, 46, 'corte', 'concluida', '2026-03-30 06:01:47', '2026-03-30 06:07:27', 330, 7),
(142, 46, 'dobra', 'concluida', '2026-03-30 06:09:13', '2026-03-30 06:09:24', 11, 8),
(143, 46, 'solda', 'pendente', NULL, NULL, 0, NULL),
(144, 46, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(145, 46, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(146, 46, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(147, 57, 'corte', 'concluida', '2026-03-31 10:52:38', '2026-03-31 11:30:02', 2244, 17),
(148, 57, 'dobra', 'concluida', '2026-03-31 11:38:13', '2026-03-31 17:23:10', 20696, 8),
(149, 57, 'solda', 'concluida', '2026-04-10 07:55:49', '2026-04-10 07:55:56', 14, 9),
(150, 57, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(151, 57, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(152, 57, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(153, 40, 'corte', 'concluida', '2026-03-30 06:01:44', '2026-03-30 06:02:04', 20, 7),
(154, 40, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(155, 40, 'solda', 'pendente', NULL, NULL, 0, NULL),
(156, 40, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(157, 40, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(158, 40, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(159, 44, 'corte', 'concluida', '2026-03-30 06:01:45', '2026-03-30 06:07:13', 328, 7),
(160, 44, 'dobra', 'concluida', '2026-03-30 06:09:11', '2026-03-30 06:09:18', 7, 8),
(161, 44, 'solda', 'pendente', NULL, NULL, 0, NULL),
(162, 44, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(163, 44, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(164, 44, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(165, 43, 'solda', 'em_andamento', '2026-03-30 06:10:10', NULL, 0, 9),
(166, 58, 'corte', 'concluida', '2026-03-31 07:27:23', '2026-03-31 07:45:05', 1061, 17),
(167, 58, 'dobra', 'concluida', '2026-03-31 08:29:40', '2026-03-31 08:30:25', 45, 8),
(168, 58, 'solda', 'pendente', NULL, NULL, 0, NULL),
(169, 58, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(170, 58, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(171, 58, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(172, 59, 'corte', 'concluida', '2026-03-31 09:59:06', '2026-03-31 10:34:26', 2120, 17),
(173, 59, 'dobra', 'concluida', '2026-03-31 11:01:13', '2026-03-31 13:45:02', 9829, 8),
(174, 59, 'solda', 'pendente', NULL, NULL, 0, NULL),
(175, 59, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(176, 59, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(177, 59, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(178, 60, 'corte', 'pendente', NULL, NULL, 0, NULL),
(179, 60, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(180, 60, 'solda', 'pendente', NULL, NULL, 0, NULL),
(181, 60, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(182, 60, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(183, 60, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(184, 61, 'corte', 'pendente', NULL, NULL, 0, NULL),
(185, 61, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(186, 61, 'solda', 'pendente', NULL, NULL, 0, NULL),
(187, 61, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(188, 61, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(189, 61, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(190, 62, 'corte', 'pendente', NULL, NULL, 0, NULL),
(191, 62, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(192, 62, 'solda', 'pendente', NULL, NULL, 0, NULL),
(193, 62, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(194, 62, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(195, 62, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(196, 63, 'corte', 'concluida', '2026-04-10 07:25:03', '2026-04-10 07:25:05', 4, 17),
(197, 63, 'dobra', 'concluida', '2026-04-14 07:21:44', '2026-04-14 07:21:51', 14, 8),
(198, 63, 'solda', 'pendente', NULL, NULL, 0, NULL),
(199, 63, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(200, 63, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(201, 63, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(202, 64, 'corte', 'pendente', NULL, NULL, 0, NULL),
(203, 64, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(204, 64, 'solda', 'pendente', NULL, NULL, 0, NULL),
(205, 64, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(206, 64, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(207, 64, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(208, 65, 'corte', 'concluida', '2026-04-07 09:28:54', '2026-04-07 10:41:08', 4334, 17),
(209, 65, 'dobra', 'concluida', '2026-04-08 05:11:06', '2026-04-08 18:04:50', 46424, 8),
(210, 65, 'solda', 'concluida', '2026-04-10 07:56:18', '2026-04-10 07:56:24', 12, 9),
(211, 65, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(212, 65, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(213, 65, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(214, 66, 'corte', 'concluida', '2026-04-07 10:12:24', '2026-04-07 10:12:30', 6, 17),
(215, 66, 'dobra', 'concluida', '2026-04-13 16:34:25', '2026-04-13 16:51:21', 2032, 8),
(216, 66, 'solda', 'pendente', NULL, NULL, 0, NULL),
(217, 66, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(218, 66, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(219, 66, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(220, 67, 'corte', 'concluida', '2026-04-07 10:12:00', '2026-04-07 10:12:02', 2, 17),
(221, 67, 'dobra', 'concluida', '2026-04-13 08:52:26', '2026-04-14 07:31:04', 115143, 8),
(222, 67, 'solda', 'pendente', NULL, NULL, 0, NULL),
(223, 67, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(224, 67, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(225, 67, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(226, 68, 'corte', 'concluida', '2026-04-07 10:11:48', '2026-04-07 10:11:57', 9, 17),
(227, 68, 'dobra', 'concluida', '2026-04-07 14:16:16', '2026-04-08 09:13:11', 24473, 8),
(228, 68, 'solda', 'em_andamento', '2026-04-10 07:57:37', NULL, 0, 9),
(229, 68, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(230, 68, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(231, 68, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(232, 69, 'corte', 'concluida', '2026-04-07 09:29:08', '2026-04-07 10:03:52', 2084, 17),
(233, 69, 'dobra', 'em_andamento', '2026-04-14 09:06:23', NULL, 0, 8),
(234, 69, 'solda', 'pendente', NULL, NULL, 0, NULL),
(235, 69, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(236, 69, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(237, 69, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(238, 70, 'corte', 'concluida', '2026-04-07 10:11:40', '2026-04-07 10:11:43', 3, 17),
(239, 70, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(240, 70, 'solda', 'pendente', NULL, NULL, 0, NULL),
(241, 70, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(242, 70, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(243, 70, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(244, 71, 'corte', 'concluida', '2026-04-08 05:15:59', '2026-04-08 10:01:37', 17138, 17),
(245, 71, 'dobra', 'concluida', '2026-04-09 11:03:33', '2026-04-10 07:57:56', 25861, 8),
(246, 71, 'solda', 'pendente', NULL, NULL, 0, NULL),
(247, 71, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(248, 71, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(249, 71, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(250, 72, 'corte', 'concluida', '2026-04-08 15:35:02', '2026-04-08 15:35:04', 2, 17),
(251, 72, 'dobra', 'concluida', '2026-04-08 17:44:19', '2026-04-08 17:44:29', 10, 8),
(252, 72, 'solda', 'concluida', '2026-04-10 07:56:00', '2026-04-10 07:56:05', 10, 9),
(253, 72, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(254, 72, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(255, 72, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(256, 73, 'corte', 'concluida', '2026-04-08 15:35:27', '2026-04-08 15:35:29', 2, 17),
(257, 73, 'dobra', 'concluida', '2026-04-10 07:59:42', '2026-04-13 14:55:12', 311129, 8),
(259, 73, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(260, 73, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(261, 73, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(262, 74, 'corte', 'concluida', '2026-04-08 16:36:42', '2026-04-08 17:36:56', 3614, 17),
(263, 74, 'dobra', 'concluida', '2026-04-09 07:45:23', '2026-04-09 08:27:53', 2550, 8),
(264, 74, 'solda', 'pendente', NULL, NULL, 0, NULL),
(265, 74, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(266, 74, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(267, 74, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(268, 75, 'corte', 'pendente', NULL, NULL, 0, NULL),
(269, 75, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(270, 75, 'solda', 'pendente', NULL, NULL, 0, NULL),
(271, 75, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(272, 75, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(273, 75, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(274, 55, 'solda', 'concluida', '2026-04-10 07:56:11', '2026-04-10 07:56:14', 6, 9),
(275, 76, 'corte', 'concluida', '2026-04-13 16:35:18', '2026-04-13 16:35:21', 6, 17),
(276, 76, 'dobra', 'concluida', '2026-04-14 06:26:31', '2026-04-14 07:17:41', 6140, 8),
(277, 76, 'solda', 'pendente', NULL, NULL, 0, NULL),
(278, 76, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(279, 76, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(280, 76, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(281, 77, 'corte', 'concluida', '2026-04-14 11:40:54', '2026-04-14 11:41:35', 82, 17),
(282, 77, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(283, 77, 'solda', 'pendente', NULL, NULL, 0, NULL),
(284, 77, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(285, 77, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(286, 77, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(287, 78, 'corte', 'pendente', NULL, NULL, 0, NULL),
(288, 78, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(289, 78, 'solda', 'pendente', NULL, NULL, 0, NULL),
(290, 78, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(291, 78, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(292, 78, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(293, 79, 'corte', 'concluida', '2026-04-15 09:22:16', '2026-04-15 09:22:30', 28, 17),
(294, 79, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(295, 79, 'solda', 'pendente', NULL, NULL, 0, NULL),
(296, 79, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(297, 79, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(298, 79, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(299, 80, 'corte', 'pendente', NULL, NULL, 0, NULL),
(300, 80, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(301, 80, 'solda', 'pendente', NULL, NULL, 0, NULL),
(302, 80, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(303, 80, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(304, 80, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(305, 81, 'corte', 'pendente', NULL, NULL, 0, NULL),
(306, 81, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(307, 81, 'solda', 'pendente', NULL, NULL, 0, NULL),
(308, 81, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(309, 81, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(310, 81, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(311, 82, 'corte', 'pendente', NULL, NULL, 0, NULL),
(312, 82, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(313, 82, 'solda', 'pendente', NULL, NULL, 0, NULL),
(314, 82, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(315, 82, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(316, 82, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(317, 83, 'corte', 'pendente', NULL, NULL, 0, NULL),
(318, 83, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(319, 83, 'solda', 'pendente', NULL, NULL, 0, NULL),
(320, 83, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(321, 83, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(322, 83, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(323, 84, 'corte', 'pendente', NULL, NULL, 0, NULL),
(324, 84, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(325, 84, 'solda', 'pendente', NULL, NULL, 0, NULL),
(326, 84, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(327, 84, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(328, 84, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(329, 85, 'corte', 'concluida', '2026-04-15 09:22:41', '2026-04-15 12:01:37', 19072, 17),
(330, 85, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(331, 85, 'solda', 'pendente', NULL, NULL, 0, NULL),
(332, 85, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(333, 85, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(334, 85, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(335, 48, 'corte', 'pendente', NULL, NULL, 0, NULL),
(336, 48, 'dobra', 'pendente', NULL, NULL, 0, NULL),
(337, 48, 'solda', 'pendente', NULL, NULL, 0, NULL),
(338, 48, 'acabamento', 'pendente', NULL, NULL, 0, NULL),
(339, 48, 'finalizacao', 'pendente', NULL, NULL, 0, NULL),
(340, 48, 'montagem', 'pendente', NULL, NULL, 0, NULL),
(341, 75, 'refrigeracao', 'pendente', NULL, NULL, 0, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_historico_status`
--

CREATE TABLE `os_historico_status` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `status_anterior` varchar(50) DEFAULT NULL,
  `status_novo` varchar(50) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `observacao` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `os_historico_status`
--

INSERT INTO `os_historico_status` (`id`, `os_id`, `status_anterior`, `status_novo`, `usuario_id`, `observacao`, `created_at`) VALUES
(39, 43, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-07 11:02:10'),
(40, 43, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-07 11:04:10'),
(41, 55, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-28 12:30:55'),
(42, 46, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-28 12:50:43'),
(43, 45, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-28 12:53:07'),
(44, 45, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-28 12:53:16'),
(45, 44, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-30 08:32:25'),
(46, 45, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-30 08:32:53'),
(47, 39, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:38:39'),
(48, 45, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:38:58'),
(49, 45, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:39:00'),
(50, 46, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:39:05'),
(51, 40, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:59:31'),
(52, 44, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 08:59:35'),
(53, 55, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Solda', '2026-03-30 08:59:54'),
(54, 58, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-30 16:30:33'),
(55, 57, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-30 17:58:25'),
(56, 48, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 11:38:44'),
(57, 47, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 11:39:25'),
(58, 56, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 11:39:33'),
(59, 54, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 11:39:36'),
(60, 59, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 12:25:46'),
(61, 59, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-31 12:26:43'),
(62, 57, 'em_revisao', 'em_producao', 16, 'Pedido liberado para produção na etapa: Corte', '2026-03-31 12:27:04'),
(63, 62, 'em_projeto', 'em_revisao', 5, 'Projeto enviado pelo projetista', '2026-03-31 14:29:25'),
(64, 65, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:06:41'),
(65, 69, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:08:47'),
(66, 66, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:08:59'),
(67, 67, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:09:29'),
(68, 68, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:09:40'),
(69, 70, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-07 11:09:58'),
(70, 72, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-08 17:58:05'),
(71, 73, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-08 17:58:34'),
(72, 74, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-08 18:38:10'),
(73, 63, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-09 14:14:17'),
(74, 76, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-13 10:29:35'),
(75, 48, 'em_revisao', 'em_producao', 2, 'Pedido liberado para produção na etapa: Solda', '2026-04-15 13:10:12'),
(76, 75, 'pendente', 'em_producao', 5, 'Projeto enviado pelo projetista. Produção iniciará em: Corte', '2026-04-15 15:17:53'),
(77, 64, 'pendente', 'em_projeto', 5, 'Projetista iniciou trabalho no projeto', '2026-04-15 18:01:13'),
(78, 64, 'em_projeto', 'em_projeto', 5, 'Projetista iniciou trabalho no projeto', '2026-04-15 18:01:23'),
(79, 80, 'pendente', 'em_projeto', 5, 'Projetista iniciou trabalho no projeto', '2026-04-15 19:38:23');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_itens`
--

CREATE TABLE `os_itens` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `descricao_manual` text DEFAULT NULL,
  `quantidade` decimal(12,2) NOT NULL DEFAULT 1.00,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `os_itens`
--

INSERT INTO `os_itens` (`id`, `os_id`, `produto_id`, `descricao_manual`, `quantidade`, `created_at`) VALUES
(1, 72, NULL, 'Cuba 60x40x40', 1.00, '2026-04-08 17:50:41'),
(2, 73, NULL, '2 cuba 50x350x200', 2.00, '2026-04-08 17:54:43'),
(3, 74, NULL, 'Codimentadora para o pedido Conect vendas', 1.00, '2026-04-08 18:37:19'),
(4, 76, NULL, 'Gaveta para balcáo refrigerado.', 7.00, '2026-04-13 10:28:03');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_materiais`
--

CREATE TABLE `os_materiais` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `numero_item` int(11) NOT NULL,
  `quantidade` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `dimensao_x` decimal(12,2) DEFAULT NULL,
  `dimensao_y` decimal(12,2) DEFAULT NULL,
  `material` varchar(200) DEFAULT NULL,
  `descricao` text DEFAULT NULL,
  `codigo` varchar(50) DEFAULT NULL,
  `processo` varchar(50) DEFAULT NULL,
  `quantidade_total` decimal(12,4) DEFAULT NULL,
  `usuario_importacao_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_observacoes`
--

CREATE TABLE `os_observacoes` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `tipo_setor` enum('vendas','projeto','gerente','producao') NOT NULL,
  `observacao` text NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `os_observacoes`
--

INSERT INTO `os_observacoes` (`id`, `os_id`, `tipo_setor`, `observacao`, `usuario_id`, `created_at`) VALUES
(21, 43, 'projeto', 'Observações Corte/Dobra: projeto de cada um separado por nome.\nObservações Solda: Fazer solda padrao fifa', 5, '2026-03-07 11:02:10'),
(22, 55, 'producao', 'RECALL: Etapa retornada de Solda para Dobra. Motivo: Retorno sem finslizar', 9, '2026-03-30 12:08:14'),
(23, 58, 'gerente', 'PVC para cima. Corte e Dobra simples.', 16, '2026-03-30 16:30:33'),
(24, 73, 'producao', 'RECALL: Etapa retornada de Solda para Dobra. Motivo: Ainda não chegou pra dobrar', 9, '2026-04-10 10:54:36'),
(25, 80, 'projeto', 'Lista de componentes dos produtos vendidos:\nMP - 06220 - Mantenedor Proteinas 6GNs 220v | Qtd vendida: 1,00\n- Resistëncia: 3,00 un\n- Chapa inox: 13,00 kg\n- Chave 30a Botáo liga/desliga: 2,00 un\n- Controlador STC1000: 2,00 un\n- Manta fibra vidro: 1,00 un\n- Manta lá de rocha: 1,00 un\n- terminais: 1,00 un\n- Tomada Prensada 20A: 1,00 un\n- Adesivo Resinado: 1,00 un\n- Cubas Gns 1/3x100: 6,00 un\n- Parafuso inox: 1,00 un\n- Parafuso comum: 1,00 un', 4, '2026-04-14 20:01:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_projetos`
--

CREATE TABLE `os_projetos` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `status` enum('pendente','em_andamento','concluido','reprovado') NOT NULL DEFAULT 'pendente',
  `data_inicio` datetime DEFAULT NULL,
  `data_conclusao` datetime DEFAULT NULL,
  `usuario_responsavel_id` int(11) DEFAULT NULL,
  `observacoes_tecnicas` text DEFAULT NULL,
  `checklist_enviado_producao` tinyint(1) NOT NULL DEFAULT 0,
  `checklist_aprova_plano` tinyint(1) NOT NULL DEFAULT 0,
  `checklist_aprova_custos` tinyint(1) NOT NULL DEFAULT 0,
  `checklist_enviado_cliente` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `os_projetos`
--

INSERT INTO `os_projetos` (`id`, `os_id`, `status`, `data_inicio`, `data_conclusao`, `usuario_responsavel_id`, `observacoes_tecnicas`, `checklist_enviado_producao`, `checklist_aprova_plano`, `checklist_aprova_custos`, `checklist_enviado_cliente`, `created_at`, `updated_at`) VALUES
(1, 64, 'em_andamento', '2026-04-15 15:01:23', NULL, 5, NULL, 0, 0, 0, 0, '2026-04-15 18:01:13', '2026-04-15 18:01:23'),
(2, 80, 'em_andamento', '2026-04-15 16:38:23', NULL, 5, NULL, 0, 0, 0, 0, '2026-04-15 19:38:23', '2026-04-15 19:38:23');

-- --------------------------------------------------------

--
-- Estrutura para tabela `os_projeto_componentes`
--

CREATE TABLE `os_projeto_componentes` (
  `id` int(11) NOT NULL,
  `projeto_id` int(11) NOT NULL,
  `componente_nome` varchar(180) NOT NULL,
  `quantidade` decimal(12,4) NOT NULL DEFAULT 1.0000,
  `unidade` varchar(20) NOT NULL DEFAULT 'un',
  `material` varchar(200) DEFAULT NULL,
  `dimensao_x` decimal(12,2) DEFAULT NULL,
  `dimensao_y` decimal(12,2) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pagamentos`
--

CREATE TABLE `pagamentos` (
  `id` int(11) NOT NULL,
  `conta_receber_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `valor_pago` decimal(15,2) NOT NULL,
  `data_pagamento` datetime NOT NULL DEFAULT current_timestamp(),
  `forma_pagamento` varchar(50) NOT NULL,
  `observacao` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `pagamentos`
--

INSERT INTO `pagamentos` (`id`, `conta_receber_id`, `usuario_id`, `valor_pago`, `data_pagamento`, `forma_pagamento`, `observacao`, `created_at`) VALUES
(1, 2, 12, 741.60, '2026-03-30 05:57:02', 'cartao', NULL, '2026-03-30 08:57:02'),
(2, 3, 12, 741.60, '2026-03-30 05:57:06', 'cartao', NULL, '2026-03-30 08:57:06'),
(3, 4, 12, 741.60, '2026-03-30 05:57:11', 'cartao', NULL, '2026-03-30 08:57:11'),
(4, 5, 12, 741.60, '2026-03-30 05:57:14', 'cartao', NULL, '2026-03-30 08:57:14'),
(5, 6, 12, 741.60, '2026-03-30 05:57:18', 'cartao', NULL, '2026-03-30 08:57:18'),
(6, 7, 12, 741.60, '2026-03-30 05:57:21', 'cartao', NULL, '2026-03-30 08:57:21'),
(7, 8, 12, 741.60, '2026-03-30 05:57:30', 'cartao', NULL, '2026-03-30 08:57:30'),
(8, 9, 12, 741.60, '2026-03-30 05:57:43', 'cartao', NULL, '2026-03-30 08:57:43'),
(9, 10, 12, 741.60, '2026-03-30 05:57:47', 'cartao', NULL, '2026-03-30 08:57:47'),
(10, 11, 12, 741.60, '2026-03-30 05:57:53', 'cartao', NULL, '2026-03-30 08:57:53');

-- --------------------------------------------------------

--
-- Estrutura para tabela `permissoes`
--

CREATE TABLE `permissoes` (
  `id` int(11) NOT NULL,
  `modulo` varchar(50) NOT NULL,
  `recurso` varchar(80) NOT NULL,
  `acao` varchar(50) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `permissoes`
--

INSERT INTO `permissoes` (`id`, `modulo`, `recurso`, `acao`, `descricao`) VALUES
(1, 'cadastros', 'usuarios', 'visualizar', 'Visualizar usu??rios'),
(2, 'cadastros', 'usuarios', 'criar', 'Criar usu??rios'),
(3, 'cadastros', 'usuarios', 'editar', 'Editar usu??rios'),
(4, 'cadastros', 'usuarios', 'excluir', 'Excluir usu??rios'),
(5, 'cadastros', 'usuarios', 'alterar_senha', 'Alterar senha de outros usu??rios'),
(6, 'cadastros', 'grupos', 'visualizar', 'Visualizar grupos'),
(7, 'cadastros', 'grupos', 'criar', 'Criar grupos'),
(8, 'cadastros', 'grupos', 'editar', 'Editar grupos'),
(9, 'cadastros', 'grupos', 'excluir', 'Excluir grupos'),
(10, 'cadastros', 'pessoas', 'visualizar', 'Visualizar pessoas'),
(11, 'cadastros', 'pessoas', 'criar', 'Criar pessoas'),
(12, 'cadastros', 'pessoas', 'editar', 'Editar pessoas'),
(13, 'cadastros', 'pessoas', 'excluir', 'Excluir pessoas'),
(14, 'cadastros', 'produtos', 'visualizar', 'Visualizar produtos'),
(15, 'cadastros', 'produtos', 'criar', 'Criar produtos'),
(16, 'cadastros', 'produtos', 'editar', 'Editar produtos'),
(17, 'cadastros', 'produtos', 'excluir', 'Excluir produtos'),
(18, 'cadastros', 'empresas', 'visualizar', 'Visualizar empresas'),
(19, 'cadastros', 'empresas', 'criar', 'Criar empresas'),
(20, 'cadastros', 'empresas', 'editar', 'Editar empresas'),
(21, 'cadastros', 'empresas', 'excluir', 'Excluir empresas'),
(22, 'cadastros', 'setores', 'visualizar', 'Visualizar setores de estoque'),
(23, 'cadastros', 'setores', 'criar', 'Criar setores'),
(24, 'cadastros', 'setores', 'editar', 'Editar setores'),
(25, 'cadastros', 'setores', 'excluir', 'Excluir setores'),
(26, 'cadastros', 'contas_bancarias', 'visualizar', 'Visualizar contas banc??rias'),
(27, 'cadastros', 'contas_bancarias', 'criar', 'Criar contas banc??rias'),
(28, 'cadastros', 'contas_bancarias', 'editar', 'Editar contas banc??rias'),
(29, 'cadastros', 'contas_bancarias', 'excluir', 'Excluir contas banc??rias'),
(30, 'cadastros', 'condicoes_pagamento', 'visualizar', 'Visualizar condi????es de pagamento'),
(31, 'cadastros', 'condicoes_pagamento', 'criar', 'Criar condi????es de pagamento'),
(32, 'cadastros', 'condicoes_pagamento', 'editar', 'Editar condi????es de pagamento'),
(33, 'cadastros', 'condicoes_pagamento', 'excluir', 'Excluir condi????es de pagamento'),
(34, 'cadastros', 'plano_contas', 'visualizar', 'Visualizar plano de contas'),
(35, 'cadastros', 'plano_contas', 'criar', 'Criar contas cont??beis'),
(36, 'cadastros', 'plano_contas', 'editar', 'Editar contas cont??beis'),
(37, 'cadastros', 'plano_contas', 'excluir', 'Excluir contas cont??beis'),
(38, 'cadastros', 'fiscal', 'visualizar', 'Visualizar cadastros fiscais'),
(39, 'cadastros', 'fiscal', 'criar', 'Criar configura????es fiscais'),
(40, 'cadastros', 'fiscal', 'editar', 'Editar configura????es fiscais'),
(41, 'cadastros', 'fiscal', 'excluir', 'Excluir configura????es fiscais'),
(42, 'vendas', 'orcamentos', 'visualizar', 'Visualizar or??amentos'),
(43, 'vendas', 'orcamentos', 'criar', 'Criar or??amentos'),
(44, 'vendas', 'orcamentos', 'editar', 'Editar or??amentos'),
(45, 'vendas', 'orcamentos', 'excluir', 'Excluir or??amentos'),
(46, 'vendas', 'orcamentos', 'converter', 'Converter or??amentos'),
(47, 'vendas', 'vendas', 'visualizar', 'Visualizar vendas'),
(48, 'vendas', 'vendas', 'criar', 'Criar vendas'),
(49, 'vendas', 'vendas', 'editar', 'Editar vendas'),
(50, 'vendas', 'vendas', 'excluir', 'Excluir vendas'),
(51, 'vendas', 'vendas', 'cancelar', 'Cancelar vendas'),
(52, 'financeiro', 'contas_receber', 'visualizar', 'Visualizar contas a receber'),
(53, 'financeiro', 'contas_receber', 'criar', 'Criar contas a receber'),
(54, 'financeiro', 'contas_receber', 'editar', 'Editar contas a receber'),
(55, 'financeiro', 'contas_receber', 'receber', 'Receber pagamentos'),
(56, 'financeiro', 'contas_pagar', 'visualizar', 'Visualizar contas a pagar'),
(57, 'financeiro', 'contas_pagar', 'criar', 'Criar contas a pagar'),
(58, 'financeiro', 'contas_pagar', 'editar', 'Editar contas a pagar'),
(59, 'financeiro', 'contas_pagar', 'pagar', 'Efetuar pagamentos'),
(60, 'financeiro', 'fluxo_caixa', 'visualizar', 'Visualizar fluxo de caixa'),
(61, 'financeiro', 'conciliacao', 'visualizar', 'Visualizar concilia????o'),
(62, 'financeiro', 'conciliacao', 'conciliar', 'Efetuar concilia????o'),
(63, 'producao', 'os', 'visualizar', 'Visualizar ordens de servi??o'),
(64, 'producao', 'os', 'criar', 'Criar ordens de servi??o'),
(65, 'producao', 'os', 'editar', 'Editar ordens de servi??o'),
(66, 'producao', 'os', 'prioridade', 'Alterar prioridade'),
(67, 'producao', 'os', 'liberar', 'Liberar para produ????o'),
(68, 'producao', 'os', 'qualidade', 'Controle de qualidade'),
(69, 'producao', 'os', 'concluir', 'Marcar como conclu??da'),
(70, 'relatorios', 'vendas', 'visualizar', 'Visualizar relat??rios de vendas'),
(71, 'relatorios', 'financeiro', 'visualizar', 'Visualizar relat??rios financeiros'),
(72, 'relatorios', 'estoque', 'visualizar', 'Visualizar relat??rios de estoque'),
(73, 'relatorios', 'producao', 'Visualizar', 'Visualizar relat??rios de produ????o'),
(74, 'cadastros', 'insumos', 'visualizar', 'Visualizar insumos'),
(75, 'cadastros', 'insumos', 'criar', 'Criar insumos'),
(76, 'cadastros', 'insumos', 'editar', 'Editar insumos'),
(77, 'cadastros', 'insumos', 'excluir', 'Excluir insumos'),
(78, 'cadastros', 'estrutura_produto', 'visualizar', 'Visualizar estrutura de produto'),
(79, 'cadastros', 'estrutura_produto', 'criar', 'Criar estrutura'),
(80, 'cadastros', 'estrutura_produto', 'editar', 'Editar estrutura'),
(81, 'cadastros', 'estrutura_produto', 'excluir', 'Excluir estrutura'),
(82, 'financeiro', 'condicoes_pagamento', 'visualizar', 'Visualizar condições de pagamento'),
(83, 'financeiro', 'condicoes_pagamento', 'criar', 'Criar condições'),
(84, 'financeiro', 'condicoes_pagamento', 'editar', 'Editar condições'),
(85, 'financeiro', 'condicoes_pagamento', 'excluir', 'Excluir condições'),
(86, 'financeiro', 'plano_contas', 'visualizar', 'Visualizar plano de contas'),
(87, 'financeiro', 'plano_contas', 'criar', 'Criar contas'),
(88, 'financeiro', 'plano_contas', 'editar', 'Editar contas'),
(89, 'financeiro', 'plano_contas', 'excluir', 'Excluir contas'),
(90, 'financeiro', 'contas_bancarias', 'visualizar', 'Visualizar contas bancárias'),
(91, 'financeiro', 'contas_bancarias', 'criar', 'Criar contas bancárias'),
(92, 'financeiro', 'contas_bancarias', 'editar', 'Editar contas bancárias'),
(93, 'financeiro', 'contas_bancarias', 'excluir', 'Excluir contas bancárias'),
(94, 'financeiro', 'formas_pagamento', 'visualizar', 'Visualizar formas de pagamento'),
(95, 'financeiro', 'formas_pagamento', 'criar', 'Criar formas de pagamento'),
(96, 'financeiro', 'formas_pagamento', 'editar', 'Editar formas de pagamento'),
(97, 'financeiro', 'formas_pagamento', 'excluir', 'Excluir formas de pagamento'),
(98, 'financeiro', 'contas_receber', 'excluir', 'Excluir contas a receber'),
(99, 'financeiro', 'contas_pagar', 'excluir', 'Excluir contas a pagar'),
(100, 'fiscal', 'naturezas_operacao', 'visualizar', 'Visualizar naturezas de operação'),
(101, 'fiscal', 'naturezas_operacao', 'criar', 'Criar naturezas de operação'),
(102, 'fiscal', 'naturezas_operacao', 'editar', 'Editar naturezas de operação'),
(103, 'fiscal', 'naturezas_operacao', 'excluir', 'Excluir naturezas de operação'),
(104, 'fiscal', 'cfop', 'visualizar', 'Visualizar CFOP'),
(105, 'fiscal', 'cfop', 'criar', 'Criar CFOP'),
(106, 'fiscal', 'cfop', 'editar', 'Editar CFOP'),
(107, 'fiscal', 'cfop', 'excluir', 'Excluir CFOP'),
(108, 'vendas', 'pedidos', 'visualizar', 'Visualizar pedidos de venda'),
(109, 'vendas', 'pedidos', 'criar', 'Criar pedidos'),
(110, 'vendas', 'pedidos', 'editar', 'Editar pedidos'),
(111, 'vendas', 'pedidos', 'excluir', 'Excluir pedidos'),
(112, 'producao', 'os', 'excluir', 'Excluir OS'),
(113, 'producao', 'os', 'apontar', 'Apontar etapas de produção'),
(114, 'producao', 'dashboard_producao', 'visualizar', 'Visualizar dashboard de produção'),
(115, 'engenharia', 'projetos', 'visualizar', 'Visualizar projetos'),
(116, 'engenharia', 'projetos', 'criar', 'Criar projetos'),
(117, 'engenharia', 'projetos', 'editar', 'Editar projetos'),
(118, 'engenharia', 'projetos', 'excluir', 'Excluir projetos'),
(119, 'engenharia', 'importar_csv', 'executar', 'Importar dados via CSV'),
(120, 'relatorios', 'gerenciais', 'visualizar', 'Visualizar relatórios gerenciais'),
(184, 'cadastros', 'formas_pagamento', 'visualizar', 'Visualizar formas de pagamento'),
(185, 'cadastros', 'formas_pagamento', 'criar', 'Criar formas de pagamento'),
(186, 'cadastros', 'formas_pagamento', 'editar', 'Editar formas de pagamento'),
(187, 'cadastros', 'formas_pagamento', 'excluir', 'Excluir formas de pagamento'),
(200, 'cadastros', 'naturezas_operacao', 'visualizar', 'Visualizar naturezas de operação'),
(201, 'cadastros', 'naturezas_operacao', 'criar', 'Criar naturezas de operação'),
(202, 'cadastros', 'naturezas_operacao', 'editar', 'Editar naturezas de operação'),
(203, 'cadastros', 'naturezas_operacao', 'excluir', 'Excluir naturezas de operação'),
(204, 'cadastros', 'cfop', 'visualizar', 'Visualizar CFOP'),
(205, 'cadastros', 'cfop', 'criar', 'Criar CFOP'),
(206, 'cadastros', 'cfop', 'editar', 'Editar CFOP'),
(207, 'cadastros', 'cfop', 'excluir', 'Excluir CFOP'),
(229, 'producao', 'os', 'producao', 'Apontar produção'),
(230, 'producao', 'dashboard', 'visualizar', 'Visualizar dashboard de produção'),
(235, 'relatorios', 'relatorios', 'visualizar', 'Visualizar relatórios');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pessoas`
--

CREATE TABLE `pessoas` (
  `id` int(11) NOT NULL,
  `tipo_pessoa` enum('cliente','fornecedor','transportadora','vendedor','funcionario','outro') NOT NULL DEFAULT 'cliente',
  `tipo_cadastro` enum('juridica','fisica') NOT NULL DEFAULT 'juridica',
  `razao_social` varchar(200) DEFAULT NULL,
  `nome_fantasia` varchar(200) DEFAULT NULL,
  `cnpj_cpf` varchar(20) DEFAULT NULL,
  `ie_rg` varchar(30) DEFAULT NULL,
  `imunicipal` varchar(30) DEFAULT NULL,
  `endereco` varchar(255) DEFAULT NULL,
  `numero` varchar(20) DEFAULT NULL,
  `complemento` varchar(100) DEFAULT NULL,
  `bairro` varchar(100) DEFAULT NULL,
  `cidade` varchar(100) DEFAULT NULL,
  `estado` varchar(2) DEFAULT NULL,
  `cep` varchar(10) DEFAULT NULL,
  `pais` varchar(50) DEFAULT 'Brasil',
  `telefone` varchar(20) DEFAULT NULL,
  `telefone2` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `email_nfe` varchar(100) DEFAULT NULL,
  `site` varchar(100) DEFAULT NULL,
  `contato_principal` varchar(100) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  `classificacao` varchar(50) DEFAULT NULL,
  `limite_credito` decimal(15,2) DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pessoas`
--

INSERT INTO `pessoas` (`id`, `tipo_pessoa`, `tipo_cadastro`, `razao_social`, `nome_fantasia`, `cnpj_cpf`, `ie_rg`, `imunicipal`, `endereco`, `numero`, `complemento`, `bairro`, `cidade`, `estado`, `cep`, `pais`, `telefone`, `telefone2`, `email`, `email_nfe`, `site`, `contato_principal`, `observacoes`, `classificacao`, `limite_credito`, `ativo`, `created_at`, `updated_at`) VALUES
(1, 'cliente', 'juridica', 'Tiao burguer', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(2, 'cliente', 'juridica', 'MultiMak', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '3199557750', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(3, 'cliente', 'fisica', 'CARILA&#039;S BURGER LTDA', 'AV FREI BENJAMIM, 2345, BRASIL, VITORIA DA CONQUISTA - BA', '53.320.548/0001-85', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '77 8852-0335', NULL, ': CARILASBURGER@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(4, 'cliente', 'fisica', 'NACOES BURGUER LTDA', 'NACOES BURGUER', '28.727.610/0001-00', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, 'NACOESBURGUER@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(5, 'cliente', 'juridica', 'Villa oba Restaurante e Pizzaria LTDA', 'Vila oba - Passos', '227787487000150', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(6, 'cliente', 'juridica', 'testenilton', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(7, 'cliente', 'fisica', 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', '59.315.327/0001-03', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 99878-2479', NULL, 'WESTBURGEER@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(8, 'cliente', 'fisica', 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', '59.315.327/0001-03', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 99878-2479', NULL, 'WESTBURGEER@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(9, 'cliente', 'fisica', 'WEST BURGER HAMBURGUERIA LTDA', 'WEST BURGER', '59.315.327/0001-03', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 99878-2479', NULL, 'WESTBURGEER@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(10, 'cliente', 'fisica', 'CASA DO HAMBURGUER LTDA', '', '51.096.590/0001-39', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(69) 99254-7598', NULL, 'FATORCONTABILPB@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(11, 'cliente', 'juridica', 'BABY SMASH COMERCIO DE GENEROS', 'BABY SMASH', '63075726000103', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(91) 989501236', NULL, 'BABYSMASHBELEM@GMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(12, 'cliente', 'juridica', 'SAULO', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(13, 'cliente', 'juridica', 'SAULO', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(14, 'cliente', 'juridica', 'JAIRO MEDEIROS DE SOUZA', 'JAIRO', '55408045000191', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(61) 9813-9247', NULL, 'medeirosjairo037@gmail.com', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(15, 'cliente', 'fisica', 'PRISCILA DE CASTRO ANDRADE', '', '50.609.016/0001-74', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(82) 98207-6254', NULL, 'THIAGO2013@LIVE.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(16, 'cliente', 'fisica', 'PEDRO HENRIQUE MARTINS SANTANA', 'FOFOCAS BAR', '05.549.428/0001-01', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(38) 98827-2182', NULL, 'CONTSENA@UAI.COM.BR', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(17, 'cliente', 'juridica', 'Haus Burguer', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(18, 'cliente', 'juridica', 'Lista/ Japones', 'Av. José Maria Alkimin, 86 - Belvedere, Belo Horizonte - MG, 30320-210', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(19, 'cliente', 'juridica', 'Saboreando', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(20, 'cliente', 'juridica', 'Conect vendas', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '31984949018', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(21, 'cliente', 'juridica', 'Consulte vendas', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '31 8494-9018', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(22, 'cliente', 'juridica', 'Restaurante Turvo', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(23, 'cliente', 'juridica', 'Seu Larica ltda', '', '46320531000162', NULL, NULL, 'Rua Luiz Simões Lopes, 17 Bangu - Rio de Janeiro / RJ CEP: 21863140', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '21982168855', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(24, 'cliente', 'juridica', 'Jardel', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(25, 'cliente', 'juridica', 'Lista/ japonês', 'Lista/ japonês', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(26, 'cliente', 'juridica', 'Haus burguer', 'Haus burguer', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(27, 'cliente', 'juridica', 'Conect vendas', 'Conect vendas', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(28, 'cliente', 'juridica', 'Leonario', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '31 9898-4438', NULL, 'leonarioguedes@hotmail.com', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(29, 'cliente', 'juridica', 'Caique souza', '', '', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '+55 77 8852-0335', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(30, 'cliente', 'juridica', 'Balcóes refrigerados.', 'Balcóes refrigerados.', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(31, 'cliente', 'juridica', 'ILTON MATOS', '', '08776040000131', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(33) 99964-1251', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(32, 'cliente', 'juridica', 'EVERTON ELVER DOS SANTOS', '', '487694770000162', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 997281636', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(33, 'cliente', 'fisica', 'BRUNO PRATES DE LIMA', '', '117825496-84', NULL, NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 986644689', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(34, 'cliente', 'juridica', 'Corrêa Gonçalves e Guimarães Alimentos Ltda', '', '36382338000100', NULL, NULL, 'Avenida Raja Gabaglia, 2000 - LOJA 06PAVMTO1BLOCO1 Estoril - Belo Horizonte / MG CEP: 30494170', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '31 9880-7202', NULL, '', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(35, 'cliente', 'juridica', 'VINICIUS OLIVEIRA HAMBURGUERIA', 'PELOTAS SANDWICHES E BURGERS', '52720062000171', NULL, NULL, 'RUA SOUSA LOPES, 192, ANEXO 204, LAUZANE PAULISTA, SÃO PAULO - SP', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(11) 959733112', NULL, 'PELOTASFOOD@OUTLOOK.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(36, 'cliente', 'juridica', '60.975.084 DAUTO LUIZ DE AGUIAR JUNIOR', '', '60975084000100', NULL, NULL, 'ROD DEPUTADO PAULINO BURIGO, 3100 - SALA LIRI - Içara / SC', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(48) 96564553', NULL, 'DTNANO@HOTMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19'),
(37, 'cliente', 'juridica', 'KI-DELICIA LTDA', 'KI-DELICIA', '45384611000119', NULL, NULL, 'Rua Santa Luzia, 2069 - LOJA A Nossa Senhora de Fátima - Sabará / MG CEP: 34600010', NULL, NULL, NULL, NULL, NULL, NULL, 'Brasil', '(31) 982507911', NULL, 'NAIANESUELEN@HOTMAIL.COM', NULL, NULL, NULL, NULL, NULL, 0.00, 1, '2026-04-16 15:24:19', '2026-04-16 15:24:19');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pessoas_atributos`
--

CREATE TABLE `pessoas_atributos` (
  `id` int(11) NOT NULL,
  `pessoa_id` int(11) NOT NULL,
  `atributo` varchar(50) NOT NULL,
  `valor` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pessoas_classificacoes`
--

CREATE TABLE `pessoas_classificacoes` (
  `id` int(11) NOT NULL,
  `nome` varchar(50) NOT NULL,
  `cor` varchar(7) DEFAULT '#6c757d',
  `tipo_aplicacao` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `pessoas_classificacoes`
--

INSERT INTO `pessoas_classificacoes` (`id`, `nome`, `cor`, `tipo_aplicacao`, `created_at`) VALUES
(1, 'VIP', '#28a745', 'cliente', '2026-04-16 15:24:19'),
(2, 'Standard', '#6c757d', 'cliente', '2026-04-16 15:24:19'),
(3, 'Bloqueado', '#dc3545', 'cliente', '2026-04-16 15:24:19'),
(4, 'Aprovado', '#28a745', 'fornecedor', '2026-04-16 15:24:19'),
(5, 'Em an??lise', '#ffc107', 'fornecedor', '2026-04-16 15:24:19');

-- --------------------------------------------------------

--
-- Estrutura para tabela `plano_contas`
--

CREATE TABLE `plano_contas` (
  `id` int(11) NOT NULL,
  `codigo` varchar(20) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `tipo` enum('receita','despesa','ativo','passivo') NOT NULL,
  `pai_id` int(11) DEFAULT NULL,
  `sintetico` tinyint(1) DEFAULT 0,
  `natureza` enum('debito','credito') DEFAULT NULL,
  `aceitar_lancamento` tinyint(1) DEFAULT 1,
  `nivel` int(11) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `plano_contas`
--

INSERT INTO `plano_contas` (`id`, `codigo`, `nome`, `tipo`, `pai_id`, `sintetico`, `natureza`, `aceitar_lancamento`, `nivel`, `created_at`) VALUES
(1, '1', 'ATIVO', 'ativo', NULL, 1, NULL, 1, 1, '2026-04-16 15:24:19'),
(2, '1.1', 'Circulante', 'ativo', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(3, '1.1.01', 'Caixa', 'ativo', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(4, '1.1.02', 'Bancos', 'ativo', NULL, 1, NULL, 1, 3, '2026-04-16 15:24:19'),
(5, '1.1.02.01', 'Conta Corrente', 'ativo', NULL, 0, NULL, 1, 4, '2026-04-16 15:24:19'),
(6, '1.1.03', 'Clientes', 'ativo', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(7, '1.1.04', 'Estoques', 'ativo', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(8, '1.2', 'Fixo', 'ativo', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(9, '2', 'PASSIVO', 'passivo', NULL, 1, NULL, 1, 1, '2026-04-16 15:24:19'),
(10, '2.1', 'Circulante', 'passivo', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(11, '2.1.01', 'Fornecedores', 'passivo', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(12, '2.1.02', 'Empr??stimos', 'passivo', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(13, '2.2', 'N??o Circulante', 'passivo', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(14, '3', 'RECEITAS', 'receita', NULL, 1, NULL, 1, 1, '2026-04-16 15:24:19'),
(15, '3.1', 'Vendas', 'receita', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(16, '3.1.01', 'Vendas de Produtos', 'receita', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(17, '3.1.02', 'Vendas de Servi??os', 'receita', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(18, '3.2', 'Financeiras', 'receita', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(19, '3.2.01', 'Juros Recebidos', 'receita', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(20, '4', 'DESPESAS', 'despesa', NULL, 1, NULL, 1, 1, '2026-04-16 15:24:19'),
(21, '4.1', 'Operacionais', 'despesa', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(22, '4.1.01', 'Custos de Produ????o', 'despesa', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(23, '4.1.02', 'Despesas Administrativas', 'despesa', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(24, '4.1.03', 'Despesas Comerciais', 'despesa', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(25, '4.2', 'Financeiras', 'despesa', NULL, 1, NULL, 1, 2, '2026-04-16 15:24:19'),
(26, '4.2.01', 'Juros Pagos', 'despesa', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19'),
(27, '4.2.02', 'Descontos Conceitos', 'despesa', NULL, 0, NULL, 1, 3, '2026-04-16 15:24:19');

-- --------------------------------------------------------

--
-- Estrutura para tabela `processos_produtivos`
--

CREATE TABLE `processos_produtivos` (
  `id` int(11) NOT NULL,
  `os_id` int(11) NOT NULL,
  `etapa` varchar(80) NOT NULL,
  `status` enum('A_FAZER','EM_PRODUCAO','AGUARDANDO_PECA','FINALIZADO') NOT NULL DEFAULT 'A_FAZER',
  `observacao` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `produtos`
--

CREATE TABLE `produtos` (
  `id` int(11) NOT NULL,
  `codigo` varchar(50) DEFAULT NULL,
  `nome` varchar(200) NOT NULL,
  `descricao` text DEFAULT NULL,
  `unidade_medida` varchar(20) NOT NULL DEFAULT 'un',
  `foto` varchar(255) DEFAULT NULL,
  `valor` decimal(15,2) NOT NULL DEFAULT 0.00,
  `custo_mao_obra` decimal(15,2) NOT NULL DEFAULT 0.00,
  `custo_indireto` decimal(15,2) NOT NULL DEFAULT 0.00,
  `margem_lucro` decimal(8,2) NOT NULL DEFAULT 30.00,
  `custo_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `preco_sugerido` decimal(15,2) NOT NULL DEFAULT 0.00,
  `estoque` int(11) DEFAULT 0,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `grupo_id` int(11) DEFAULT NULL,
  `familia_id` int(11) DEFAULT NULL,
  `tipo_produto` enum('produto','servico','mat_prima','embalagem','ativo_fixo') DEFAULT 'produto',
  `ncm` varchar(10) DEFAULT NULL,
  `cest` varchar(10) DEFAULT NULL,
  `uni` varchar(10) DEFAULT 'UN',
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `serie` varchar(50) DEFAULT NULL,
  `peso_liq` decimal(12,4) DEFAULT NULL,
  `peso_bruto` decimal(12,4) DEFAULT NULL,
  `dimensoes` varchar(50) DEFAULT NULL,
  `controle_estoque` tinyint(1) DEFAULT 1,
  `estoque_minimo` decimal(12,2) DEFAULT 0.00,
  `ponto_pedido` decimal(12,2) DEFAULT 0.00,
  `custo_medio` decimal(15,4) DEFAULT 0.0000,
  `custo_padrao` decimal(15,4) DEFAULT NULL,
  `altura` decimal(10,2) DEFAULT NULL,
  `largura` decimal(10,2) DEFAULT NULL,
  `profundidade` decimal(10,2) DEFAULT NULL,
  `atributos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`atributos`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `produtos`
--

INSERT INTO `produtos` (`id`, `codigo`, `nome`, `descricao`, `unidade_medida`, `foto`, `valor`, `custo_mao_obra`, `custo_indireto`, `margem_lucro`, `custo_total`, `preco_sugerido`, `estoque`, `status`, `created_at`, `updated_at`, `grupo_id`, `familia_id`, `tipo_produto`, `ncm`, `cest`, `uni`, `marca`, `modelo`, `serie`, `peso_liq`, `peso_bruto`, `dimensoes`, `controle_estoque`, `estoque_minimo`, `ponto_pedido`, `custo_medio`, `custo_padrao`, `altura`, `largura`, `profundidade`, `atributos`) VALUES
(11, 'MP-04', 'Mantenedor Proteinas 4GNs', '', 'un', '69c7c34c2af6f_1774699340.png', 3058.00, 0.00, 0.00, 30.00, 0.00, 0.00, 1000, 'ativo', '2026-03-28 12:02:20', '2026-04-15 11:57:09', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(12, 'MP - 06220', 'Mantenedor Proteinas 6GNs 220v', 'Construção em Aço inox;\r\nControlador de temperatura digital\r\nControle individual por seção. \r\nTemperatura média de trabalho 65ºC\r\nAjuste de temperatura de 50º a 100ºC\r\nProtege contra odores e contaminações, garantindo hambúrgueres suculentos e seguros\r\nIdeal para manter o padrão em estabelecimentos de fast-food e restaurantes\r\nFechado na parte traseira\r\nPés com regulagem de altura\r\nCuba Gn em aço inox ou Policarbonato;\r\nTensão(v) 220\r\n\r\nMedidas: 720x310x380mm', 'un', '69d36a0be63d2_1775462923.png', 5489.00, 0.00, 0.00, 30.00, 2480.80, 3225.04, 0, 'ativo', '2026-04-06 08:08:43', '2026-04-15 11:56:58', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(13, 'MP - 06110v', 'Mantenedor Proteinas 6GNs 110v', 'Construção em Aço inox; Controlador de temperatura digital Controle individual por seção. Temperatura média de trabalho 65ºC Ajuste de temperatura de 50º a 100ºC Protege contra odores e contaminações, garantindo hambúrgueres suculentos e seguros Ideal para manter o padrão em estabelecimentos de fast-food e restaurantes Fechado na parte traseira Pés com regulagem de altura Cuba Gn em aço inox ou Policarbonato; Tensão(v) 110v Medidas: 720x310x380mm', 'un', '69d36c6d8c376_1775463533.png', 5489.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-06 08:18:53', '2026-04-15 11:56:01', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(14, 'MP - 08220', 'Mantenedor Proteinas 8GNs 220v', 'Construção em Aço inox; Controlador de temperatura digital Controle individual por seção. Temperatura média de trabalho 65ºC Ajuste de temperatura de 50º a 100ºC Protege contra odores e contaminações, garantindo hambúrgueres suculentos e seguros Ideal para manter o padrão em estabelecimentos de fast-food e restaurantes Fechado na parte traseira Pés com regulagem de altura Cuba Gn em aço inox ou Policarbonato; Tensão(v) 220 Medidas: 930x310x380mm', 'un', '69d36ced06ef9_1775463661.png', 7095.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-06 08:21:01', '2026-04-15 11:55:32', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(15, 'CF-50', 'CONSERVADOR DE FRITURAS CF-50 - 220', 'Construção em Aço inox;\r\n2 Lâmpadas infravermelho;\r\nCesto Batata removível;\r\nTemperatura média de trabalho 60ºC\r\nGaveta coletora de gordura.\r\nPés com regulagem de altura\r\nBandeja de apoio batatas\r\nTensão(v) 220\r\n500 x 500 x 800', 'un', '69df7f416f288_1776254785.jpg', 1900.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:03:43', '2026-04-15 12:46:35', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(17, 'CF-50 - 110', 'CONSERVADOR DE FRITURAS CF-50 - 110', 'Construção em Aço inox;\r\n2 Lâmpadas infravermelho;\r\nCesto Batata removível;\r\nTemperatura média de trabalho 60ºC\r\nGaveta coletora de gordura.\r\nPés com regulagem de altura\r\nBandeja de apoio batatas\r\nTensão(v) 110\r\nMEDIDA: 500 x 500 x 800', 'un', '69df86954e2a6_1776256661.jpg', 1900.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:37:41', '2026-04-15 12:38:45', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(18, 'CF-21', 'CONSERVADOR DE FRITURAS CF-21 - 220', 'Construção em Aço inox;\r\nLâmpada Infravermelho;\r\nTemperatura média de trabalho 65ºC\r\nPés com regulagem de altura\r\nCuba Gn em aço inox 1/1 x 150 Removível;\r\n\r\n\r\nMEDIDA: 360 x 240 x 700', 'un', '69df885a43c5e_1776257114.jpg', 2200.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:45:14', '2026-04-15 12:47:50', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(20, 'CF-21 110', 'CONSERVADOR DE FRITURAS CF- 21 - 110', 'Construção em Aço inox;\r\nLâmpada Infravermelho;\r\nTemperatura média de trabalho 65ºC\r\nPés com regulagem de altura\r\nCuba Gn em aço inox 1/1 x 150 Removível;\r\n\r\n\r\nMEDIDAS: 360 x 240 x 700', 'un', '69df89345f608_1776257332.jpg', 2200.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:48:52', '2026-04-15 12:48:52', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(21, 'TOASTER 0425 - 110', 'TOASTER PRIME 0425 - 110', 'TOSTER ELETRICO ESTEIRA SIMPLES\r\nPRIME 0425\r\n2,0 Kw\r\n220v 60Hz ~1\r\nMEDIDA: 490 x 320 x 410\r\n04 pães /minuto\r\n6A', 'un', '69df8a797e3c8_1776257657.jpg', 6350.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:54:17', '2026-04-15 12:54:17', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(22, 'TOASTER 0425 - 220', 'TOASTER PRIME 0425 - 220', 'TOSTER ELETRICO ESTEIRA SIMPLES\r\nPRIME 0425\r\n2,0 Kw\r\n220v 60Hz ~1\r\nMEDIDA: 490 x 320 x 410\r\n04 pães /minuto\r\n6A', 'un', '69df8aad5b657_1776257709.jpg', 6350.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:55:09', '2026-04-15 12:55:09', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(23, 'TOASTER 0625 - 110', 'TOASTER PRIME 0625 - 110', 'TOASTER\r\nPRIME 6025\r\n3,0 Kw\r\n220v 60Hz ~1\r\nMEDIDA: 455 x 620 320\r\nAté 08 pães /minuto', 'un', '69df8b55789d7_1776257877.jpg', 11790.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:57:57', '2026-04-15 12:57:57', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL),
(24, 'TOASTER 0625 - 220', 'TOASTER PRIME 0625 - 220', 'TOASTER\r\nPRIME 6025\r\n3,0 Kw\r\n220v 60Hz ~1\r\nMEDIDA: 455 x 620 320\r\nAté 08 pães /minuto', 'un', '69df8b7a6edc7_1776257914.jpg', 11790.00, 0.00, 0.00, 30.00, 0.00, 0.00, 0, 'ativo', '2026-04-15 12:58:34', '2026-04-15 12:58:34', NULL, NULL, 'produto', NULL, NULL, 'UN', NULL, NULL, NULL, NULL, NULL, NULL, 1, 0.00, 0.00, 0.0000, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `regras_tributacao`
--

CREATE TABLE `regras_tributacao` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `estado_origem` varchar(2) DEFAULT NULL,
  `estado_destino` varchar(2) DEFAULT NULL,
  `tipo_pessoa` varchar(20) DEFAULT NULL,
  `cfop` varchar(10) DEFAULT NULL,
  `incidencia_icms` varchar(20) DEFAULT 'tributada',
  `aliquota_icms` decimal(5,2) DEFAULT 0.00,
  `incidencia_ipi` varchar(20) DEFAULT 'nao_tributada',
  `aliquota_ipi` decimal(5,2) DEFAULT 0.00,
  `incidencia_pis` varchar(20) DEFAULT 'nao_tributada',
  `aliquota_pis` decimal(5,2) DEFAULT 0.00,
  `incidencia_cofins` varchar(20) DEFAULT 'nao_tributada',
  `aliquota_cofins` decimal(5,2) DEFAULT 0.00,
  `incidencia_iss` varchar(20) DEFAULT 'nao_tributada',
  `aliquota_iss` decimal(5,2) DEFAULT 0.00,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `regras_tributacao`
--

INSERT INTO `regras_tributacao` (`id`, `nome`, `descricao`, `estado_origem`, `estado_destino`, `tipo_pessoa`, `cfop`, `incidencia_icms`, `aliquota_icms`, `incidencia_ipi`, `aliquota_ipi`, `incidencia_pis`, `aliquota_pis`, `incidencia_cofins`, `aliquota_cofins`, `incidencia_iss`, `aliquota_iss`, `ativo`, `created_at`) VALUES
(1, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:24:20'),
(2, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:24:20'),
(3, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:24:20'),
(4, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:24:20'),
(5, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:25:41'),
(6, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:25:41'),
(7, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:25:41'),
(8, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:25:41'),
(9, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:27:48'),
(10, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:27:48'),
(11, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:27:48'),
(12, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:27:48'),
(13, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:28:56'),
(14, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:28:56'),
(15, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:28:56'),
(16, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:28:56'),
(17, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:30:17'),
(18, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:30:17'),
(19, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:30:17'),
(20, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:30:17'),
(21, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:33:36'),
(22, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:33:36'),
(23, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:33:36'),
(24, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:33:36'),
(25, 'Venda-interestadual-ST', 'Venda interestadual para STF', 'SP', 'SP', NULL, '6101', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:35:00'),
(26, 'Venda-interestadual', 'Venda interestadual interestadual', 'SP', 'MG', NULL, '6102', 'tributada', 12.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:35:00'),
(27, 'Venda-interna', 'Venda interna SP', 'SP', 'SP', NULL, '5101', 'tributada', 18.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:35:00'),
(28, 'Venda-isento', 'Venda isenta de ICMs', 'SP', 'SP', NULL, '5102', 'isenta', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 'nao_tributada', 0.00, 1, '2026-04-16 15:35:00');

-- --------------------------------------------------------

--
-- Estrutura para tabela `sessoes`
--

CREATE TABLE `sessoes` (
  `id` varchar(128) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` varchar(255) DEFAULT NULL,
  `data_criacao` datetime NOT NULL DEFAULT current_timestamp(),
  `data_expiracao` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `setores_estoque`
--

CREATE TABLE `setores_estoque` (
  `id` int(11) NOT NULL,
  `empresa_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `nome` varchar(100) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `tipo` enum('principal','materia_prima','produto_acabado','terceiros','retorno','transito') DEFAULT 'principal',
  `endereco` varchar(255) DEFAULT NULL,
  `capacidade` decimal(12,2) DEFAULT NULL,
  `capacidade_unidade` varchar(20) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `setores_estoque`
--

INSERT INTO `setores_estoque` (`id`, `empresa_id`, `parent_id`, `nome`, `descricao`, `tipo`, `endereco`, `capacidade`, `capacidade_unidade`, `ativo`, `created_at`, `updated_at`) VALUES
(1, 1, NULL, 'Estoque Principal', 'Armazenamento principal', 'principal', NULL, NULL, NULL, 1, '2026-04-16 15:24:18', '2026-04-16 15:24:18'),
(2, 1, NULL, 'Mat??ria-Prima', 'Materiais para produ????o', 'materia_prima', NULL, NULL, NULL, 1, '2026-04-16 15:24:18', '2026-04-16 15:24:18'),
(3, 1, NULL, 'Produtos Acabados', 'Produtos prontos para venda', 'produto_acabado', NULL, NULL, NULL, 1, '2026-04-16 15:24:18', '2026-04-16 15:24:18');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tempo_producao`
--

CREATE TABLE `tempo_producao` (
  `id` int(11) NOT NULL,
  `produto_id` int(11) NOT NULL,
  `etapa` varchar(80) NOT NULL,
  `minutos_estimados` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipos_caixa`
--

CREATE TABLE `tipos_caixa` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `categoria` enum('dinheiro','pix','cartao_credito','cartao_debito','boleto','transferencia','outro') NOT NULL DEFAULT 'outro',
  `taxa_padrao_antecipacao` decimal(5,2) NOT NULL DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `tipos_caixa`
--

INSERT INTO `tipos_caixa` (`id`, `nome`, `categoria`, `taxa_padrao_antecipacao`, `ativo`, `created_at`, `updated_at`) VALUES
(1, 'Dinheiro', 'dinheiro', 0.00, 1, '2026-03-18 14:41:37', '2026-03-18 14:41:37'),
(2, 'PIX', 'pix', 0.00, 1, '2026-03-18 14:41:37', '2026-03-18 14:41:37'),
(3, 'Cartao de Credito', 'cartao_credito', 0.00, 1, '2026-03-18 14:41:37', '2026-03-18 14:41:37'),
(4, 'Cartao de Debito', 'cartao_debito', 0.00, 1, '2026-03-18 14:41:37', '2026-03-18 14:41:37'),
(5, 'Boleto', 'boleto', 0.00, 1, '2026-03-18 14:41:37', '2026-03-18 14:41:37');

-- --------------------------------------------------------

--
-- Estrutura para tabela `tipos_documento_fiscal`
--

CREATE TABLE `tipos_documento_fiscal` (
  `id` int(11) NOT NULL,
  `codigo` varchar(10) NOT NULL,
  `descricao` varchar(100) NOT NULL,
  `serie` int(11) DEFAULT 1,
  `modelo` varchar(10) DEFAULT '55',
  `tipo` enum('entrada','saida') NOT NULL,
  `ativo` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `tipos_documento_fiscal`
--

INSERT INTO `tipos_documento_fiscal` (`id`, `codigo`, `descricao`, `serie`, `modelo`, `tipo`, `ativo`, `created_at`) VALUES
(1, '55', 'NF-e', 1, '55', 'saida', 1, '2026-04-16 15:24:20'),
(2, '65', 'NFC-e', 1, '65', 'saida', 1, '2026-04-16 15:24:20'),
(3, '01', 'NFS-e', 1, '00', 'saida', 1, '2026-04-16 15:24:20');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL,
  `nome` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `tipo` enum('master','vendedor','projetista','gerente','producao','corte','dobra','solda','acabamento','finalizacao','montagem','dashboard_producao') NOT NULL,
  `status` enum('ativo','inativo') DEFAULT 'ativo',
  `receber_notificacao_email` tinyint(1) NOT NULL DEFAULT 1,
  `receber_notificacao_whatsapp` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `telefone_whatsapp` varchar(30) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `usuarios`
--

INSERT INTO `usuarios` (`id`, `nome`, `email`, `senha`, `tipo`, `status`, `receber_notificacao_email`, `receber_notificacao_whatsapp`, `created_at`, `updated_at`, `telefone_whatsapp`) VALUES
(1, 'Administrador', 'admin@sistema.com', '123', 'master', 'ativo', 1, 0, '2026-01-31 18:02:44', '2026-02-15 09:57:52', NULL),
(2, 'jose', 'jose@cozinca.com.br', '$2y$10$cnGMOFcXt3yr3zqQ9I9oMOpF7B/Y7Hx7buz837ynJrZ10oGkUXhci', 'gerente', 'ativo', 1, 0, '2026-01-31 19:13:40', '2026-04-15 16:34:12', NULL),
(4, 'camile', 'camile@cozinca.com.br', '$2y$10$xONA7R7gZmxwsyTVNBPYjOtQxWsoGZ8sJiKx0ENG1GlgekK9cC4S6', 'vendedor', 'ativo', 1, 0, '2026-01-31 19:14:36', '2026-04-15 10:23:24', NULL),
(5, 'projetista', 'projetista@cozinca.com.br', '$2y$10$.rwbalIOAN83TalRFKEHae31gBRFC.Z7RB1CvtNU13.dKpL/nqTpK', 'projetista', 'ativo', 1, 0, '2026-01-31 19:43:30', '2026-04-16 17:36:46', NULL),
(6, 'nilton', 'nilton@cozinca.com.br', '$2y$10$fzT4yk.G0qkgjx4g5X9/YeXpeTTmnSyLL1eSDQqEQp7olLf1C4vCO', 'vendedor', 'ativo', 1, 0, '2026-02-01 03:40:40', '2026-04-15 10:53:55', NULL),
(7, 'corte', 'corte@cozinca.com.br', '$2y$10$QFiOQDlJ60.r3w07JZWu8.HAzx.KyGuf0I2e5889CulA6hatdP5li', 'corte', 'ativo', 1, 0, '2026-02-01 03:52:04', '2026-04-13 10:30:53', NULL),
(8, 'dobra', 'dobra@cozinca.com.br', '$2y$10$Ytbnib100XOUqO46cGnHI.cRCR9fYcUJi2lTfOCdSSjpAwI/2OM4K', 'dobra', 'ativo', 1, 0, '2026-02-01 03:52:25', '2026-04-15 09:06:46', NULL),
(9, 'solda', 'solda@cozinca.com.br', '$2y$10$iImfna05T8tiwRaJc/4Y5O50xZy/oA4wDo5NXkVkSDtUFS85zgJ8S', 'solda', 'ativo', 1, 0, '2026-02-01 03:52:42', '2026-04-15 10:16:33', NULL),
(10, 'Finalizacao', 'finalizacao@cozinca.com.br', '$2y$10$jVDxYpokjTYWB.BdXnFYCecx4dxUY4seTcKw4lizRtXwDAddcBQEC', 'finalizacao', 'ativo', 1, 0, '2026-02-01 12:52:03', '2026-03-16 12:08:51', NULL),
(11, 'paulo cesar', 'pc@cozinca.com.br', '$2y$10$t7/ZOhIoav1s.KjnJ6Jw6.Umf8do9gVOF10UjpInnsa7NDXmLTs6u', 'acabamento', 'ativo', 1, 0, '2026-02-07 13:56:42', '2026-02-22 08:47:13', NULL),
(12, 'Novo Admin', 'admin2@sistema.com', '$2a$12$QlzJqyHpFRbxmTcM5phY1OiKU4zkwnsVV9HRnBbupn9c/56BdbwuK', 'master', 'ativo', 1, 0, '2026-02-15 10:00:23', '2026-04-10 10:06:14', NULL),
(13, 'Andre', 'andre@cozinca.com.br', '$2y$10$EiG7OqJ5vkn4XmY.WzEM1e0ShJeHG/56wfDMNaBocqVUzvmWnJoiG', 'montagem', 'ativo', 1, 0, '2026-02-16 10:31:38', '2026-03-01 09:49:47', NULL),
(14, 'dashhboard', 'dashboard@cozinca.com.br', '$2y$10$1iEEo5orXN7Qrk3.KGeO1.qJKCv30qYiK6QPlBGns9BpwNED2gl92', 'dashboard_producao', 'ativo', 1, 0, '2026-02-16 10:59:49', '2026-04-08 10:58:04', NULL),
(16, 'Marcos Antonio', 'Marcos@cozinca.com.br', '$2y$10$./4tbWekIHbF2LTcKf1.6u.4IMkJ4qLaXiiG534t8NsOaFqVsPuAu', 'gerente', 'ativo', 1, 0, '2026-02-17 03:48:04', '2026-04-15 10:57:07', NULL),
(17, 'Paulinho', 'paulinho@cozinca.com.br', '$2y$10$9E7sRatvBCnILjwT7TPVc.Qeve4VIiP0m/UrIpRpPSjyJID2jOpUa', 'corte', 'ativo', 1, 0, '2026-02-17 04:01:05', '2026-04-15 15:01:13', NULL),
(18, 'Guilherme Aguiar', 'guilherme@cozinca.com.br', '$2y$10$HBpA4KpWFf.tLe8jqcC6Y.iEJxr5GVydanB6BeLRvANUMruDa6Sae', 'vendedor', 'ativo', 1, 0, '2026-03-05 08:23:44', '2026-04-14 12:19:29', NULL);

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios_2fa`
--

CREATE TABLE `usuarios_2fa` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `secret_key` varchar(255) NOT NULL,
  `method_backup` varchar(20) DEFAULT NULL COMMENT 'email, sms',
  `enabled` tinyint(1) NOT NULL DEFAULT 0,
  `verified_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios_expedientes`
--

CREATE TABLE `usuarios_expedientes` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_referencia` date NOT NULL,
  `status` enum('em_trabalho','encerrado') NOT NULL DEFAULT 'em_trabalho',
  `iniciado_em` datetime NOT NULL,
  `finalizado_em` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `usuarios_expedientes`
--

INSERT INTO `usuarios_expedientes` (`id`, `usuario_id`, `data_referencia`, `status`, `iniciado_em`, `finalizado_em`, `created_at`, `updated_at`) VALUES
(1, 7, '2026-03-30', 'encerrado', '2026-03-30 06:01:36', '2026-03-30 06:07:17', '2026-03-30 09:01:36', '2026-03-30 09:07:17'),
(2, 8, '2026-03-30', 'encerrado', '2026-03-30 06:09:07', '2026-03-30 09:06:59', '2026-03-30 09:09:07', '2026-03-30 12:06:59'),
(3, 9, '2026-03-30', 'em_trabalho', '2026-03-30 06:10:07', NULL, '2026-03-30 09:10:07', '2026-03-30 09:10:07'),
(4, 17, '2026-03-30', 'encerrado', '2026-03-30 08:58:58', '2026-03-30 10:55:53', '2026-03-30 11:58:58', '2026-03-30 13:55:53'),
(5, 16, '2026-03-30', 'em_trabalho', '2026-03-30 16:43:45', NULL, '2026-03-30 19:43:45', '2026-03-30 19:43:45'),
(6, 17, '2026-03-31', 'encerrado', '2026-03-31 06:17:11', '2026-03-31 17:03:59', '2026-03-31 09:17:11', '2026-03-31 20:03:59'),
(7, 8, '2026-03-31', 'encerrado', '2026-03-31 07:08:52', '2026-03-31 17:23:18', '2026-03-31 10:08:52', '2026-03-31 20:23:18'),
(8, 17, '2026-04-01', 'encerrado', '2026-04-01 06:10:47', '2026-04-01 06:10:47', '2026-04-01 09:10:47', '2026-04-01 09:10:47'),
(9, 8, '2026-04-01', 'encerrado', '2026-04-01 07:04:47', '2026-04-01 19:32:02', '2026-04-01 10:04:47', '2026-04-01 22:32:02'),
(10, 8, '2026-04-02', 'encerrado', '2026-04-02 07:08:27', '2026-04-02 17:02:26', '2026-04-02 10:08:27', '2026-04-02 20:02:26'),
(11, 17, '2026-04-02', 'encerrado', '2026-04-02 07:13:52', '2026-04-02 17:03:49', '2026-04-02 10:13:52', '2026-04-02 20:03:49'),
(12, 17, '2026-04-06', 'encerrado', '2026-04-06 07:09:50', '2026-04-06 17:01:25', '2026-04-06 10:09:50', '2026-04-06 20:01:25'),
(13, 8, '2026-04-06', 'encerrado', '2026-04-06 07:37:03', '2026-04-06 17:01:19', '2026-04-06 10:37:03', '2026-04-06 20:01:19'),
(14, 17, '2026-04-07', 'encerrado', '2026-04-07 06:05:01', '2026-04-07 17:02:29', '2026-04-07 09:05:01', '2026-04-07 20:02:29'),
(15, 8, '2026-04-07', 'encerrado', '2026-04-07 07:21:38', '2026-04-07 17:01:57', '2026-04-07 10:21:38', '2026-04-07 20:01:57'),
(16, 8, '2026-04-08', 'encerrado', '2026-04-08 05:10:59', '2026-04-08 18:07:56', '2026-04-08 08:10:59', '2026-04-08 21:07:56'),
(17, 17, '2026-04-08', 'em_trabalho', '2026-04-08 05:15:58', NULL, '2026-04-08 08:15:58', '2026-04-08 08:15:58'),
(18, 16, '2026-04-08', 'em_trabalho', '2026-04-08 10:37:23', NULL, '2026-04-08 13:37:23', '2026-04-08 13:37:23'),
(19, 17, '2026-04-09', 'encerrado', '2026-04-09 06:16:56', '2026-04-09 19:35:39', '2026-04-09 09:16:56', '2026-04-09 22:35:39'),
(20, 8, '2026-04-09', 'encerrado', '2026-04-09 07:03:35', '2026-04-09 17:25:45', '2026-04-09 10:03:35', '2026-04-09 20:25:45'),
(22, 7, '2026-04-09', 'em_trabalho', '2026-04-09 07:57:56', NULL, '2026-04-09 10:57:56', '2026-04-09 10:57:56'),
(23, 16, '2026-04-09', 'em_trabalho', '2026-04-09 07:58:07', NULL, '2026-04-09 10:58:07', '2026-04-09 10:58:07'),
(24, 17, '2026-04-10', 'encerrado', '2026-04-10 06:12:54', '2026-04-10 15:52:58', '2026-04-10 09:12:54', '2026-04-10 18:52:58'),
(25, 8, '2026-04-10', 'em_trabalho', '2026-04-10 07:09:07', NULL, '2026-04-10 10:09:07', '2026-04-10 10:09:07'),
(26, 16, '2026-04-10', 'em_trabalho', '2026-04-10 07:18:17', NULL, '2026-04-10 10:18:17', '2026-04-10 10:18:17'),
(27, 9, '2026-04-10', 'em_trabalho', '2026-04-10 07:55:41', NULL, '2026-04-10 10:55:41', '2026-04-10 10:55:41'),
(28, 16, '2026-04-13', 'em_trabalho', '2026-04-13 07:03:35', NULL, '2026-04-13 10:03:35', '2026-04-13 10:03:35'),
(29, 17, '2026-04-13', 'encerrado', '2026-04-13 07:04:09', '2026-04-13 17:02:50', '2026-04-13 10:04:09', '2026-04-13 20:02:50'),
(30, 8, '2026-04-13', 'encerrado', '2026-04-13 07:25:13', '2026-04-13 17:01:38', '2026-04-13 10:25:13', '2026-04-13 20:01:38'),
(31, 17, '2026-04-14', 'encerrado', '2026-04-14 06:09:01', '2026-04-14 17:00:52', '2026-04-14 09:09:01', '2026-04-14 20:00:52'),
(32, 8, '2026-04-14', 'encerrado', '2026-04-14 06:19:51', '2026-04-14 17:00:15', '2026-04-14 09:19:51', '2026-04-14 20:00:15'),
(33, 8, '2026-04-15', 'em_trabalho', '2026-04-15 06:07:23', NULL, '2026-04-15 09:07:23', '2026-04-15 09:07:23'),
(34, 17, '2026-04-15', 'em_trabalho', '2026-04-15 09:22:07', NULL, '2026-04-15 12:22:07', '2026-04-15 12:22:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios_expediente_logs`
--

CREATE TABLE `usuarios_expediente_logs` (
  `id` int(11) NOT NULL,
  `expediente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `tipo` enum('inicio','fim') NOT NULL,
  `registrado_em` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Despejando dados para a tabela `usuarios_expediente_logs`
--

INSERT INTO `usuarios_expediente_logs` (`id`, `expediente_id`, `usuario_id`, `tipo`, `registrado_em`, `created_at`) VALUES
(1, 1, 7, 'inicio', '2026-03-30 06:01:36', '2026-03-30 09:01:36'),
(2, 1, 7, 'fim', '2026-03-30 06:07:17', '2026-03-30 09:07:17'),
(3, 2, 8, 'inicio', '2026-03-30 06:09:07', '2026-03-30 09:09:07'),
(4, 3, 9, 'inicio', '2026-03-30 06:10:07', '2026-03-30 09:10:07'),
(5, 4, 17, 'inicio', '2026-03-30 08:58:58', '2026-03-30 11:58:58'),
(6, 2, 8, 'fim', '2026-03-30 09:06:59', '2026-03-30 12:06:59'),
(7, 4, 17, 'fim', '2026-03-30 10:55:53', '2026-03-30 13:55:53'),
(8, 5, 16, 'inicio', '2026-03-30 16:43:45', '2026-03-30 19:43:45'),
(9, 6, 17, 'inicio', '2026-03-31 06:17:11', '2026-03-31 09:17:11'),
(10, 7, 8, 'inicio', '2026-03-31 07:08:52', '2026-03-31 10:08:52'),
(11, 6, 17, 'fim', '2026-03-31 17:03:59', '2026-03-31 20:03:59'),
(12, 7, 8, 'fim', '2026-03-31 17:23:18', '2026-03-31 20:23:18'),
(13, 8, 17, 'inicio', '2026-04-01 06:10:47', '2026-04-01 09:10:47'),
(14, 8, 17, 'fim', '2026-04-01 06:10:47', '2026-04-01 09:10:47'),
(15, 9, 8, 'inicio', '2026-04-01 07:04:47', '2026-04-01 10:04:47'),
(16, 9, 8, 'fim', '2026-04-01 19:32:02', '2026-04-01 22:32:02'),
(17, 10, 8, 'inicio', '2026-04-02 07:08:27', '2026-04-02 10:08:27'),
(18, 11, 17, 'inicio', '2026-04-02 07:13:52', '2026-04-02 10:13:52'),
(19, 10, 8, 'fim', '2026-04-02 17:02:26', '2026-04-02 20:02:26'),
(20, 11, 17, 'fim', '2026-04-02 17:03:49', '2026-04-02 20:03:49'),
(21, 12, 17, 'inicio', '2026-04-06 07:09:50', '2026-04-06 10:09:50'),
(22, 13, 8, 'inicio', '2026-04-06 07:37:03', '2026-04-06 10:37:03'),
(23, 13, 8, 'fim', '2026-04-06 17:01:19', '2026-04-06 20:01:19'),
(24, 12, 17, 'fim', '2026-04-06 17:01:25', '2026-04-06 20:01:25'),
(25, 14, 17, 'inicio', '2026-04-07 06:05:01', '2026-04-07 09:05:01'),
(26, 15, 8, 'inicio', '2026-04-07 07:21:38', '2026-04-07 10:21:38'),
(27, 15, 8, 'fim', '2026-04-07 17:01:57', '2026-04-07 20:01:57'),
(28, 14, 17, 'fim', '2026-04-07 17:02:29', '2026-04-07 20:02:29'),
(29, 16, 8, 'inicio', '2026-04-08 05:11:00', '2026-04-08 08:11:00'),
(30, 17, 17, 'inicio', '2026-04-08 05:15:58', '2026-04-08 08:15:58'),
(31, 18, 16, 'inicio', '2026-04-08 10:37:23', '2026-04-08 13:37:23'),
(32, 16, 8, 'fim', '2026-04-08 18:07:56', '2026-04-08 21:07:56'),
(33, 19, 17, 'inicio', '2026-04-09 06:16:56', '2026-04-09 09:16:56'),
(34, 20, 8, 'inicio', '2026-04-09 07:03:35', '2026-04-09 10:03:35'),
(37, 22, 7, 'inicio', '2026-04-09 07:57:56', '2026-04-09 10:57:56'),
(38, 23, 16, 'inicio', '2026-04-09 07:58:07', '2026-04-09 10:58:07'),
(39, 20, 8, 'fim', '2026-04-09 17:25:45', '2026-04-09 20:25:45'),
(40, 19, 17, 'fim', '2026-04-09 19:35:39', '2026-04-09 22:35:39'),
(41, 24, 17, 'inicio', '2026-04-10 06:12:54', '2026-04-10 09:12:54'),
(42, 25, 8, 'inicio', '2026-04-10 07:09:07', '2026-04-10 10:09:07'),
(43, 26, 16, 'inicio', '2026-04-10 07:18:17', '2026-04-10 10:18:17'),
(44, 27, 9, 'inicio', '2026-04-10 07:55:41', '2026-04-10 10:55:41'),
(45, 24, 17, 'fim', '2026-04-10 15:52:58', '2026-04-10 18:52:58'),
(46, 28, 16, 'inicio', '2026-04-13 07:03:35', '2026-04-13 10:03:35'),
(47, 29, 17, 'inicio', '2026-04-13 07:04:09', '2026-04-13 10:04:09'),
(48, 30, 8, 'inicio', '2026-04-13 07:25:13', '2026-04-13 10:25:13'),
(49, 30, 8, 'fim', '2026-04-13 17:01:38', '2026-04-13 20:01:38'),
(50, 29, 17, 'fim', '2026-04-13 17:02:50', '2026-04-13 20:02:50'),
(51, 31, 17, 'inicio', '2026-04-14 06:09:01', '2026-04-14 09:09:01'),
(52, 32, 8, 'inicio', '2026-04-14 06:19:51', '2026-04-14 09:19:51'),
(53, 32, 8, 'fim', '2026-04-14 17:00:15', '2026-04-14 20:00:15'),
(54, 31, 17, 'fim', '2026-04-14 17:00:52', '2026-04-14 20:00:52'),
(55, 33, 8, 'inicio', '2026-04-15 06:07:23', '2026-04-15 09:07:23'),
(56, 34, 17, 'inicio', '2026-04-15 09:22:07', '2026-04-15 12:22:07');

-- --------------------------------------------------------

--
-- Estrutura para tabela `usuarios_grupos`
--

CREATE TABLE `usuarios_grupos` (
  `id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `grupo_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Despejando dados para a tabela `usuarios_grupos`
--

INSERT INTO `usuarios_grupos` (`id`, `usuario_id`, `grupo_id`, `created_at`) VALUES
(1, 1, 1, '2026-04-16 15:24:15'),
(2, 12, 1, '2026-04-16 15:24:15'),
(3, 4, 3, '2026-04-16 15:24:15'),
(4, 6, 3, '2026-04-16 15:24:15'),
(5, 18, 3, '2026-04-16 15:24:15'),
(6, 5, 4, '2026-04-16 15:24:15'),
(7, 2, 2, '2026-04-16 15:24:15'),
(8, 16, 2, '2026-04-16 15:24:15'),
(9, 7, 5, '2026-04-16 15:24:15'),
(10, 17, 5, '2026-04-16 15:24:15'),
(11, 8, 5, '2026-04-16 15:24:15'),
(12, 9, 5, '2026-04-16 15:24:15'),
(13, 11, 5, '2026-04-16 15:24:15'),
(14, 10, 5, '2026-04-16 15:24:15'),
(15, 13, 5, '2026-04-16 15:24:15'),
(16, 14, 5, '2026-04-16 15:24:15');

-- --------------------------------------------------------

--
-- Estrutura para tabela `vendas`
--

CREATE TABLE `vendas` (
  `id` int(11) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `orcamento_id` int(11) DEFAULT NULL,
  `cliente_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `data_venda` date NOT NULL,
  `valor_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `desconto` decimal(15,2) NOT NULL DEFAULT 0.00,
  `forma_pagamento` enum('avista','cartao','boleto') DEFAULT NULL,
  `caixa_tipo_id` int(11) DEFAULT NULL,
  `num_parcelas` int(11) NOT NULL DEFAULT 1,
  `taxa_antecipacao_percent` decimal(5,2) NOT NULL DEFAULT 0.00,
  `faturado_em` datetime DEFAULT NULL,
  `faturado_por` int(11) DEFAULT NULL,
  `data_recebimento_prevista` date DEFAULT NULL,
  `tipo_entrada` varchar(50) DEFAULT NULL,
  `valor_entrada` decimal(15,2) NOT NULL DEFAULT 0.00,
  `data_entrada` date DEFAULT NULL,
  `desconto_financeiro_tipo` varchar(20) DEFAULT NULL,
  `desconto_financeiro_valor` decimal(15,2) NOT NULL DEFAULT 0.00,
  `juros_percent` decimal(7,2) NOT NULL DEFAULT 0.00,
  `taxa_fixa` decimal(15,2) NOT NULL DEFAULT 0.00,
  `documento_financeiro` varchar(80) DEFAULT NULL,
  `numero_documento_financeiro` varchar(80) DEFAULT NULL,
  `palavra_chave_financeira` varchar(120) DEFAULT NULL,
  `status` enum('em_andamento','concluida','cancelada') DEFAULT 'em_andamento',
  `observacoes` text DEFAULT NULL,
  `observacoes_venda` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `vendas`
--

INSERT INTO `vendas` (`id`, `numero`, `orcamento_id`, `cliente_id`, `usuario_id`, `data_venda`, `valor_total`, `desconto`, `forma_pagamento`, `caixa_tipo_id`, `num_parcelas`, `taxa_antecipacao_percent`, `faturado_em`, `faturado_por`, `data_recebimento_prevista`, `tipo_entrada`, `valor_entrada`, `data_entrada`, `desconto_financeiro_tipo`, `desconto_financeiro_valor`, `juros_percent`, `taxa_fixa`, `documento_financeiro`, `numero_documento_financeiro`, `palavra_chave_financeira`, `status`, `observacoes`, `observacoes_venda`, `created_at`, `updated_at`) VALUES
(39, 'VND-0001', NULL, 20, 18, '2026-03-04', 2620.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', NULL, '2026-03-05 08:46:49', '2026-04-06 08:47:02'),
(42, 'VND-0002', NULL, 21, 18, '2026-03-05', 5980.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', 'Vende Feita por Representante em Sete Lagoas.\r\n\r\nValor total do pedido: R$7.220,00\r\nComissao: R$1200,00\r\n\r\nForma de pagamento: Integral na entrega.\r\nNegociado a entrega por nossa conta.\r\n\r\nLevar Maquina Cartao. 10X Sem juros.', NULL, '2026-03-05 09:57:31', '2026-04-06 08:46:51'),
(43, 'VND-0003', NULL, 22, 18, '2026-03-05', 6730.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', NULL, '2026-03-05 13:47:14', '2026-03-26 09:13:36'),
(44, 'VND-0004', NULL, 23, 18, '2026-03-05', 8950.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', 'Espaço inicial para toster \r\nMeio da montagem- Pista quente dos dois lados\r\n5 Cubas aquecidas por resistência ( banho Maria )\r\n5 Cubas crias\r\nEspaço para 2 tipos de acoplado\r\nGaveta de lixo\r\nEspaço para 4 bisnagas de molho dos dois lados \r\nConsevador de proteína 9 GNS \r\nFinal- espaço para potinho de molho, ketchup, saco sos. \r\n\r\nVENDA SAMY\r\nPAGO NO CARTAO 6X SEM JUROS. R$ 8950', NULL, '2026-03-05 14:05:25', '2026-03-28 12:32:48'),
(45, 'VND-0005', NULL, 24, 18, '2026-03-06', 65592.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'Pedido 1 de 2. \r\nAguardando medidas da camara fria e confirmação da coifa e das pistas aquecidas.', NULL, '2026-03-06 15:55:35', '2026-03-06 15:55:35'),
(46, 'VND-0006', NULL, 21, 4, '2026-03-08', 11121.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'concluida', 'teste', NULL, '2026-03-08 04:54:04', '2026-03-30 09:09:18'),
(47, 'VND-0007', NULL, 22, 4, '2026-03-08', 322.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'concluida', 'testeslktjalskejtalkwsejtalkwejstlkajwelsktajsel;kjatl;swekjta;lkewjtalkwej;lkajwkerjtalkwjlkawjetlkawjelkt', NULL, '2026-03-08 04:55:55', '2026-03-30 09:08:48'),
(48, 'VND-0008', NULL, 25, 6, '2026-03-10', 5666.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'concluida', 'maurio com 5 prateleiras aeres.', NULL, '2026-03-10 14:43:56', '2026-03-30 09:09:24'),
(49, 'VND-0009', NULL, 26, 6, '2026-03-12', 930.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', NULL, '2026-03-12 12:35:01', '2026-03-12 12:35:01'),
(50, 'VND-0010', NULL, 29, 6, '2026-03-11', 10530.00, 0.00, 'cartao', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', NULL, '2026-03-12 12:55:21', '2026-03-12 12:55:21'),
(51, 'VND-0011', NULL, 30, 6, '2026-03-12', 5760.00, 0.00, 'cartao', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '0+12x de R$ 480,00.\r\nPAGAMENTO FEIOTO ATRAVÉS DE LINK DIA 11/03/2026.', NULL, '2026-03-12 12:59:10', '2026-03-12 12:59:10'),
(52, 'VND-0012', NULL, 31, 18, '2026-03-14', 3120.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', NULL, '2026-03-14 14:02:55', '2026-03-26 09:14:28'),
(53, 'VND-0013', NULL, 33, 6, '2026-03-17', 7530.00, 0.00, 'avista', NULL, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', NULL, '2026-03-17 11:28:18', '2026-03-17 11:28:18'),
(54, 'VND-0014', NULL, 34, 6, '2026-03-18', 16598.40, 0.00, 'cartao', 3, 10, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', NULL, '2026-03-19 11:22:44', '2026-03-19 11:25:04'),
(55, 'VND-0015', NULL, 35, 6, '2026-03-19', 22594.35, 1700.65, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'O CLIENTE PAGOU R$ 10.000,00 - 19/03/2026.\r\n\r\nO RESTANTE IRÁ SER NA RETIRADA.', NULL, '2026-03-19 17:43:48', '2026-03-19 17:44:36'),
(56, 'VND-0016', NULL, 36, 18, '2026-03-24', 3180.00, 0.00, 'avista', 1, 1, 0.00, '2026-03-24 19:26:11', 18, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', 'Com válvula de acionamento via joelho.\r\nMEDIDAS:1800X520X900', NULL, '2026-03-24 22:25:17', '2026-04-06 08:39:44'),
(57, 'VND-0017', NULL, 37, 18, '2026-03-24', 11510.65, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'Coifa de encosto.', '', '2026-03-24 22:41:43', '2026-03-30 13:13:48'),
(58, 'VND-0018', NULL, 38, 18, '2026-03-23', 7416.00, 0.00, 'cartao', 3, 10, 0.00, '2026-03-30 05:38:05', 18, NULL, NULL, 0.00, NULL, 'valor', 0.00, 0.00, 0.00, 'venda', 'VND-0018', 'Saboreando', 'em_andamento', 'Bancada Podendo ser dividida em 2 modulos por cauda do tamanho. \r\nCom banho maria a seco central, capacidade de 16gns 1/2x150mm.\r\nSuporte para lâmpadas aquecidas infravermelho (2 unidades) ao lado direito, com capacidade para 2 cubas gns 1/2x150mm;\r\nEquipamento 220v; \r\nDividido em 3 modulos, sendo 1 de 60x1150 1 de 1150x2700 1 de 1150x800 Possui prateleira lisa inferior à 50 cm acima do tampo; Prateleira lisa inferior à 200mm acima do piso. Medidas finais: 3200x1150x900', NULL, '2026-03-24 22:56:26', '2026-03-30 08:38:05'),
(59, 'VND-0019', NULL, 39, 18, '2026-03-23', 2100.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'Cliente deixou as Caixas de amostra.', 'Pagar na retirada. PIX', '2026-03-30 08:51:39', '2026-03-30 08:51:39'),
(60, 'VND-0020', NULL, 40, 18, '2026-03-30', 496.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'concluida', 'Chapa 1,2mm aço 430', 'Pagar ao retirar', '2026-03-30 16:27:26', '2026-03-31 11:30:25'),
(61, 'VND-0021', NULL, 41, 18, '2026-03-31', 0.00, 0.00, 'avista', 1, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', '', '2026-03-31 12:23:50', '2026-04-06 08:38:43'),
(62, 'VND-0022', NULL, 41, 18, '2026-03-31', 0.00, 0.00, 'avista', 1, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', 'Aço inox 304', '2026-03-31 12:55:32', '2026-04-06 08:38:38'),
(63, 'VND-0023', NULL, 42, 4, '2026-03-31', 28865.00, 0.00, 'cartao', 3, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', '', '2026-03-31 13:31:13', '2026-03-31 13:36:38'),
(64, 'VND-0024', NULL, 42, 4, '2026-03-30', 28865.00, 0.00, 'cartao', 3, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', '', '2026-03-31 13:42:03', '2026-03-31 13:42:03'),
(65, 'VND-0025', NULL, 36, 18, '2026-03-24', 3180.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'Receber na entrega.', '2026-04-06 08:46:07', '2026-04-06 08:46:07'),
(66, 'VND-0026', NULL, 38, 18, '2026-03-24', 7416.00, 0.00, 'cartao', 3, 10, 10.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '220v', 'Venda Eduardo.\r\n20%comissão.\r\nValor total: R$9.290,00\r\n20%\r\n\r\nPago integralmente no cartão.', '2026-04-06 09:21:32', '2026-04-06 09:21:32'),
(67, 'VND-0027', NULL, 37, 18, '2026-04-03', 6219.60, 2300.40, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'A ultima prateleira de 1,05x20 ela tem um angulo. \r\nTem as fotos com medidas em anexo.', 'Venda Eduardo. \r\n15% comissáo.\r\nEntrada de R$3100,00\r\nRestante na retirada. \r\n\r\nValor total: R$6.219,50\r\n\r\nValor de desconto real é de 20% ( sendo 15 cozinca + 5% eduardo). \r\nA diferença é referente a remocao de uma prateleira no valor de R$660,00 que o cliente havia pago.', '2026-04-06 10:18:28', '2026-04-06 10:18:28'),
(68, 'VND-0028', NULL, 26, 6, '2026-03-06', 930.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'IRÁ SER FABRICADO 2 GAVETAS PARA A BASE REFRIGERADA DO CLIENTE. PORTA A SER TROCADA SERÁ NO LADO DIREITO DA BASE. MEDIDA DA BASE DO CLIENTE: 1800C / 730L / 700A\r\n\r\nO CLIENTE JÁ PAGOU 50% DO PEDIDO.', '2026-04-06 10:40:30', '2026-04-06 10:40:30'),
(69, 'VND-0029', NULL, 29, 6, '2026-03-11', 10530.00, 0.00, 'cartao', 3, 3, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', '', '2026-04-06 10:42:31', '2026-04-06 10:42:31'),
(70, 'VND-0030', NULL, 33, 6, '2026-03-16', 7530.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'O CLIENTE PAGOU 30% DE ENTRADA, O RESTANTE SERÁ FINALIZADO NA ENTREGA.', '2026-04-06 10:47:40', '2026-04-06 10:47:40'),
(71, 'VND-0031', NULL, 34, 6, '2026-03-18', 16598.40, 0.00, 'cartao', 3, 10, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', '', '2026-04-06 10:50:43', '2026-04-06 10:50:43'),
(72, 'VND-0032', NULL, 35, 6, '2026-03-19', 22594.35, 1700.65, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'O CLIENTE PAGOU R$ 10.000,00 - 19/03/2026.\r\n\r\nO RESTANTE IRÁ SER NA RETIRADA.', '2026-04-06 10:53:28', '2026-04-06 10:53:28'),
(73, 'VND-0033', NULL, 43, 18, '2026-04-06', 25000.33, 4425.67, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'Entrada de R$10.000,000 Restante em 4x.', '2026-04-08 07:16:47', '2026-04-08 07:16:47'),
(74, 'VND-0034', NULL, 47, 18, '2026-04-09', 10041.85, 993.15, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'MODELO EM ANEXO.', 'Entrada de 50% (R$5.000,00).\r\nFrete por conta do cliente: R$340,00, saulo irá entregar.', '2026-04-09 09:47:41', '2026-04-09 09:47:41'),
(75, 'VND-0035', NULL, 50, 6, '2026-03-09', 7250.00, 0.00, 'cartao', 3, 6, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'balcão refrigerado\r\nBALCÃO REFRIGERADO 1 PORTA: CONSTRUÇÃO EM AÇO INOX INTERNO E EXTERNO, PRATELEIRAS INTERNAS E EXTERNAS EM CORTE A LASER, GABINETE EM 100% DE POLIORETANO INJETADO, REFRIGERAÇÃO POR AR FORÇADO, CONTROLADOR DIGITAL, SAPATA NIVELADORA REGULÁVEL. MEDIDA: 1100C x 610A x 650L', '2026-04-14 13:13:08', '2026-04-14 13:13:08'),
(76, 'VND-0036', NULL, 51, 6, '2026-03-19', 3000.00, 0.00, 'cartao', 3, 6, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', '', '2026-04-14 13:16:02', '2026-04-14 13:16:02'),
(77, 'VND-0037', NULL, 52, 6, '2026-02-05', 13382.60, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'concluida', '', 'PAGAMENTO FEITO VIA PIX DA BASE REFRIGERADA, NO VALOR DE R$8.732,60 À VISTA (PIX).\r\n\r\nA MESA DE MONAGEM, SERÁ FEITA O PAGAMENTO TOTAL DE 6X NO CARTÃO DE CRÉDITO, NO DIA DA RETIRADA DO EQUIPAMENTO.', '2026-04-14 13:18:28', '2026-04-15 12:22:30'),
(78, 'VND-0038', NULL, 53, 4, '2026-04-14', 35969.00, 0.00, 'cartao', 3, 10, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'OS TOASTER SAIU NO VALOR DE r$5.100,00', '2026-04-14 20:01:07', '2026-04-14 20:01:07'),
(79, 'VND-0039', NULL, 54, 6, '2026-04-10', 36525.75, 2749.25, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'cancelada', '', 'O CLIENTE FEZ A ENTRADA EM PIX, VALOR DE R$ 16.525,75 NA DATA DE 10/04/2026.\r\nO RESTANTE SERÁ PAGO NA ENTREGA.', '2026-04-15 10:34:34', '2026-04-15 11:39:50'),
(80, 'VND-0040', NULL, 55, 6, '2026-04-14', 10700.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'O CLIENTE FEZ 50% DO VALOR DO EQUIPAMENTO, IRÁ PAGAR O RESTANTE NA RETIRADA.', '2026-04-15 10:38:47', '2026-04-15 10:38:47'),
(81, 'VND-0041', NULL, 56, 6, '2026-04-14', 5715.00, 0.00, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'PAGAMENTO FEITO POR PIX', '2026-04-15 10:44:43', '2026-04-15 10:44:43'),
(82, 'VND-0042', NULL, 56, 6, '2026-04-14', 11342.00, 0.00, 'cartao', 3, 8, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', 'PAGAMENTO FEITO COM LINK, DIA 14/04/2026 PAGAMENTO INTEGRAL 8X SEM JUROS.', '', '2026-04-15 10:47:59', '2026-04-15 10:47:59'),
(83, 'VND-0043', NULL, 54, 6, '2026-04-10', 36525.75, 2749.25, 'avista', 2, 1, 0.00, NULL, NULL, NULL, NULL, 0.00, NULL, NULL, 0.00, 0.00, 0.00, NULL, NULL, NULL, 'em_andamento', '', 'CLIENTE FEZ A ENTRADA EM PIX, VALOR DE R$ 16.525,75 NA DATA DE 10/04/2026.\r\nO RESTANTE SERÁ PAGO NA ENTREGA.', '2026-04-15 11:53:33', '2026-04-15 11:53:33');

-- --------------------------------------------------------

--
-- Estrutura para tabela `vendas_itens`
--

CREATE TABLE `vendas_itens` (
  `id` int(11) NOT NULL,
  `venda_id` int(11) NOT NULL,
  `produto_id` int(11) DEFAULT NULL,
  `descricao_manual` text DEFAULT NULL,
  `quantidade` decimal(15,2) NOT NULL DEFAULT 1.00,
  `valor_unitario` decimal(15,2) NOT NULL DEFAULT 0.00,
  `valor_total` decimal(15,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Despejando dados para a tabela `vendas_itens`
--

INSERT INTO `vendas_itens` (`id`, `venda_id`, `produto_id`, `descricao_manual`, `quantidade`, `valor_unitario`, `valor_total`, `created_at`) VALUES
(93, 39, NULL, 'Mesa de encosto, com rodobanca. Medida: 1400x700x750(altura)', 1.00, 1148.00, 1148.00, '2026-03-05 08:46:49'),
(94, 39, NULL, 'Mesa de encosto, com rodobanca. Prateleira inferior e prateleira superior á 40cm acima do tampo. Largura da prateleira superior: 35cm. Medidas: 1100x700x900', 1.00, 1472.00, 1472.00, '2026-03-05 08:46:49'),
(95, 42, NULL, 'Fogão industrial com 10 trempes, sendo cada trempe no tamanho 30 x 30 cm, equipado com registros individuais, conforme pedido do cliente. O equipamento é fabricado integralmente em aço inox AISI 304, garantindo maior durabilidade, resistência à corrosão e', 1.00, 5980.00, 5980.00, '2026-03-05 09:57:31'),
(96, 43, NULL, 'MESA MONTAGEM. PARA 05 CUBAS 1/4 NO TAMPO- SUPORTE SUPERIOR PARA 05 GNS 1/4 . PRATELEIRA LISA SUPERIOR COM SUPORTE PARA MOLHEIRA,TAMPO AQUECIDO ,COM 02 LAMPADAS AQUECIMENTO INFRAVERMELHO SUPERIOR. 04 GAVETAS PARA EMBALAGENS. NICHO PARA CAIXAS PLASTICAS, C', 1.00, 6730.00, 6730.00, '2026-03-05 13:47:14'),
(97, 44, NULL, 'MESA MONTAGEM 1850X900X900', 1.00, 8950.00, 8950.00, '2026-03-05 14:05:25'),
(98, 45, NULL, 'COIFA CHURRASQUEIRA EM AÇO INOX 430, CHAPA 1,2MM INDUSTRIAL, EXAUSTÃO CENTRÍFUGA, 15 MTS DE DUTO EM AÇO GALVANIZADO FLANGEADO. 2 CURVAS 45 GRAUS. FECHAMENTO DE CHAPA INOX FRONTAL PARA TAMPAR DUTO. MEDIDA: 2000X1000', 1.00, 21416.00, 21416.00, '2026-03-06 15:55:35'),
(99, 45, NULL, 'FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI UMA CUBA CENTRAL DE 60X50X40, DOTADA DE SAPATA NIVELADORA DE NYLON, COM PANELEIRO PERFURADO 100MM ACIMA DO PISO MEDIDAS: 2000X700X900 ITEM: 1', 1.00, 3360.00, 3360.00, '2026-03-06 15:55:35'),
(100, 45, NULL, 'BANCADA EM AÇO INOX FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. , DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 70X70X60 ITEM 1.1', 1.00, 560.00, 560.00, '2026-03-06 15:55:35'),
(101, 45, NULL, 'BANCADA EM AÇO INOX COM CUBA FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI UMA CUBA LADO DIREITO DE 50X40X30, DOTADA DE SAPATA NIVELADORA DE NYLON, COM PANELEIRO PERFURADO 100MM ACIMA DO PISO MEDIDAS: 1300X700X900 ITEM: 1.2', 1.00, 1680.00, 1680.00, '2026-03-06 15:55:35'),
(102, 45, NULL, 'PRATELEIRA PERFURADA FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX PERFURADA MEDIDA: 2000X400 ITEN:1.3', 2.00, 787.20, 1574.40, '2026-03-06 15:55:35'),
(103, 45, NULL, 'BANCADA EM AÇO INOX FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI UMA CUBA DE 50X40X30, DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 1200X600x900 ITEN:4', 1.00, 1352.00, 1352.00, '2026-03-06 15:55:35'),
(104, 45, NULL, 'PRATELEIRA EM AÇO INOX FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX SUSPENSA. MEDIDA: 1200X300 ITEN: 5', 1.00, 392.00, 392.00, '2026-03-06 15:55:35'),
(105, 45, NULL, 'ESTANTE EM AÇO INOX FABRICADO EM AÇO INOX AISI 201, CHAPA ESPESSURA 0,80MM, DOTADO DE SAPATA NIVELADORA EM NYLON. COM 05 PLANOS MEDIDAS: 1700X500X1800 ITEN: 8', 2.00, 1980.00, 3960.00, '2026-03-06 15:55:35'),
(106, 45, NULL, 'BANCADA COM 2 CUBAS FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI DUAS CUBAS DE 70X50X40, DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 2200X700X900 INTE: 9', 1.00, 2624.00, 2624.00, '2026-03-06 15:55:35'),
(107, 45, NULL, 'PRATELEIRA PERFURADA FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX PERFURADA MEDIDA: 2200X400 ITEN:10', 1.00, 774.40, 774.40, '2026-03-06 15:55:35'),
(108, 45, NULL, 'PIA ASSÉPSIA FABRICADA EM AÇO INOX AISI 201, CHAPA 0,80. COM VÁLVULA DE ACIONAMENTO VIA JOELHO AUTÓMATICA. MEDIDAS: 360X360 ITEN: 11', 2.00, 816.00, 1632.00, '2026-03-06 15:55:35'),
(109, 45, NULL, 'BANCADA COM 2 CUBAS FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI DUAS CUBAS DE 50X40X30 DOTADA DE SAPATA NIVELADORA DE NYLON, COM RESPALDO LATERAL COM PANELEIRO COM 10CM ACIMA. MEDIDAS: 2200X700X900 ITEM: 12', 2.00, 3804.80, 7609.60, '2026-03-06 15:55:35'),
(110, 45, NULL, 'PRATELEIRA PERFURADA FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX PERFURADA MEDIDA: 1100X400 ITEN: 13', 2.00, 500.00, 1000.00, '2026-03-06 15:55:35'),
(111, 45, NULL, 'PRATELEIRA AÇO INOX FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX. MEDIDA: 1980X400 ITEN 16', 2.00, 672.00, 1344.00, '2026-03-06 15:55:35'),
(112, 45, NULL, 'BANCADA COM CUBA FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI UMA CUBA 50X40X25, COM PANELEIRO PERFURADO À 200MM ACIMA DO PISO. DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 2200X700X900 ITEN: 17', 1.00, 2528.00, 2528.00, '2026-03-06 15:55:35'),
(113, 45, NULL, 'BANCADA INOX FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA COM PANELEIRO LISO INFERIOR À 200MM ACIMA DO PISO. DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 2200X700X900 ITEN: 18', 1.00, 2153.60, 2153.60, '2026-03-06 15:55:35'),
(114, 45, NULL, 'BANCADA COM FURO PARA DETRITOS FABRICADA EM AÇO INOX AISI 201, CHAPA 0,80MM. ESTRUTURA TUBULAR DE 38MM, DOTADO DE SAPATA NIVELADORA EM NYLON. FURO CIRCULAR DE 20CM PARA DETRITOS. MEDIDAS: 1470X700X900 ITEN: 15', 1.00, 1516.80, 1516.80, '2026-03-06 15:55:35'),
(115, 45, NULL, 'BANCADA COM CUBA FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. POSSUI UMA CUBA DE 50X40X25, COM PANELEIRO PERFURADO À 200MM ACIMA DO PISO. DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 2200X700X900 ITEN:19', 1.00, 2528.00, 2528.00, '2026-03-06 15:55:35'),
(116, 45, NULL, 'PRATELEIRA EM AÇO INOX FABRICADO EM AÇO INOX AISI 201, PRATELEIRA EM INOX. MEDIDA: 2200X400 ITEN:20', 3.00, 739.20, 2217.60, '2026-03-06 15:55:35'),
(117, 45, NULL, 'BANCADA DE CENTRO FABRICADO EM AÇO INOX AISI 201, ESPESSURA 0,80 MM. MESA REFORÇADA. , DOTADA DE SAPATA NIVELADORA DE NYLON. MEDIDAS: 2000X700X900 ITEN: 22', 2.00, 1574.40, 3148.80, '2026-03-06 15:55:35'),
(118, 45, NULL, 'PRATELEIRA SOB MONTANTE FABRICADO EM AÇO INOX AISI 201, CHAPA 0,80MM; COM 04 PÉS EM TUBO DE 1 1/2\", TAMPÃO DE BORRACHA NA PONTA. MEDIDAS: 1800X330X600 ITEN: 23', 2.00, 662.40, 1324.80, '2026-03-06 15:55:35'),
(119, 45, NULL, 'BANCADA APOIO FABRICADA EM AÇO INOX AISI 201, CHAPA 0,80MM. ESTRUTURA TUBULAR DE 38MM, CONTRAVADA COM TUBO DE 7/8, DOTADO DE SAPTA NIVELADORA EM NYLON. MEDIDAS: 700X800X600 ITEN:33', 1.00, 896.00, 896.00, '2026-03-06 15:55:35'),
(120, 46, NULL, 'mesa 01 falsdkjfalkdsjaflkdsjlk', 1.00, 2344.00, 2344.00, '2026-03-08 04:54:04'),
(121, 46, NULL, 'mesa 02 laksdjfalksdjfal;ksdj fal;kdsj', 1.00, 3322.00, 3322.00, '2026-03-08 04:54:04'),
(122, 46, NULL, 'mesa 03 amsdlfkajsldkfjalksdjaflksd', 1.00, 4232.00, 4232.00, '2026-03-08 04:54:04'),
(123, 46, NULL, 'mesa 04 pia com prateleira em ciam e blalalaalalalalala', 1.00, 1223.00, 1223.00, '2026-03-08 04:54:04'),
(124, 47, NULL, 'Mesa lisa de encosto.', 1.00, 322.00, 322.00, '2026-03-08 04:55:55'),
(125, 48, NULL, 'descricao mesa', 1.00, 5666.00, 5666.00, '2026-03-10 14:43:56'),
(126, 49, NULL, 'Peça sob medida IRÁ SER FABRICADO 2 GAVETAS PARA A BASE REFRIGERADA DO CLIENTE. PORTA A SER TROCADA SERÁ NO LADO DIREITO DA BASE. MEDIDA DA BASE DO CLIENTE: 1800C / 730L / 700A 930,00	1	930,00 TOTAL', 1.00, 930.00, 930.00, '2026-03-12 12:35:01'),
(127, 50, NULL, 'MESA PARA HAMBURGUERIA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. COM SAPATA NIVELADORA EM NYLON. SUPORTE SUPERIOR PARA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) E NO TAMPO DA MESA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6). PRATELEIRA LISA SUPERIOR. COM SU', 1.00, 6730.00, 6730.00, '2026-03-12 12:55:21'),
(128, 50, NULL, 'Peça sob medida MESA DE PARTIDA - NICHO PARA EMBALAGENS - PRATELEIRA SUPERIOR NO COMPRIMENTO DA MESA, COM DUAS LAMPADAS DE AQUECIMENTO, COM 2 PANELEIROS INFERIORES. MEDIDAS: 1000C x 900A x 900L', 1.00, 3800.00, 3800.00, '2026-03-12 12:55:21'),
(129, 51, NULL, 'TOASTER 0425', 1.00, 5760.00, 5760.00, '2026-03-12 12:59:10'),
(130, 52, NULL, 'FABRICADO EM AÇO INOX 304, CHAPA 1,2 mm. MEDIDAS: 1650X550', 1.00, 3120.00, 3120.00, '2026-03-14 14:02:55'),
(131, 53, NULL, 'MESA PARA HAMBURGUERIA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. COM SAPATA NIVELADORA EM NYLON. SUPORTE SUPERIOR PARA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) E NO TAMPO DA MESA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) BANHO MARIA. PRATELEIRA LISA SUPE', 1.00, 7530.00, 7530.00, '2026-03-17 11:28:18'),
(134, 54, NULL, 'TOASTER 0425', 1.00, 6398.40, 6398.40, '2026-03-19 11:25:04'),
(135, 54, NULL, 'Bancada SOB MEDIDA Inox MESA DE HAMBURGUERIA - MESA INOX LISA DE PRODUÇÃO 1500X700X900 - PISTA QUENTE NA AREA DE TRABALHO - PISTA PARA 06 Gns 1/4 100 – SENDO DUAS CUBAS PARA BANHO MARIA. - 1 PRATELEIRA INFERIOR - MONTANTE DE DOIS PLANOS - NICHO PARA SUPOR', 1.00, 10200.00, 10200.00, '2026-03-19 11:25:04'),
(139, 55, NULL, 'BASE REFRIGERADA PARA CONGELAMENTO Construção em Aço inox; Controlador de temperatura digital Temperatura média de trabalho -10 a -18ºC Possui isolamento em Polioretano Injetado; 100% inox, interno e externo; Processo de fabricação em corte a laser; Com 4', 1.00, 14700.00, 14700.00, '2026-03-19 17:44:36'),
(140, 55, NULL, 'MANTENEDOR DE PROTEÍNAS 8GN´S', 1.00, 7095.00, 7095.00, '2026-03-19 17:44:36'),
(141, 55, NULL, 'MESA LISA EM INOX COM RODOBANCA FABRICADO EM AÇO INOX AISI 430, CHAPA ESPESSURA 0,80MM ,DOTADA DE SAPATA NIVELADORA DE NYLON. COM TAMPO AQUECIDO NA FRENTE MEDIDAS: 1500X700X900', 1.00, 2500.00, 2500.00, '2026-03-19 17:44:36'),
(147, 58, NULL, 'Bancada SOB MEDIDA Inox Balcão SelfService Fabricado em aço inox aisi 201, chapa 0,80mm. Estrutura tubular de 38mm. Com banho maria a seco central, capacidade de 16gns 1/2x150mm. Suporte para lâmpadas aquecidas infravermelho (2 unidades) ao lado direito.', 1.00, 7416.00, 7416.00, '2026-03-24 22:56:26'),
(148, 56, NULL, 'Bancada SOB MEDIDA Inox BANCADA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, ESPESSURA 0,80MM CONTEM DOIS BOJOS NAS MEDIDAS 50X40X25, 02 PRATELEIRAS INFERIORES, 04 GAVETAS, SOB ESTRUTURA TUBULAR DE 38 MM, DOTADA DE SAPATA NIVELADORA DE NYLON MEDIDAS:1800X', 1.00, 3000.00, 3000.00, '2026-03-24 22:59:59'),
(149, 56, NULL, 'Adicional da válvula de acionmaneto via joelho', 1.00, 180.00, 180.00, '2026-03-24 22:59:59'),
(154, 59, NULL, 'Gabinete em aço inox aisi 304, chapa 0,60mm. Tampo 0,80mm. Com 4 gavetas/ suporte para GN 1/1x65 ao lado esquerdo. 02 gavetas para Caixa hortifruti ao lado direito. \nGavetas leves para Pães. \nCodimentadora superior com tampa articulada. Com isolmaneto em polioretano injetado, bolsa de gel, geloX. \nHaste para fixaçao de dispenser no tampo. \n\nMedidas externas: 90x70x90', 1.00, 2100.00, 2100.00, '2026-03-30 08:51:39'),
(155, 57, NULL, 'Coifa em Aço Inox Fabricada em aço inox aisi 430, chapa 0,80mm Com iluminacao interna e filtro. Exaustor axial de 300mm industrial. Medidas: 2000x820x450', 1.00, 9473.75, 9473.75, '2026-03-30 13:13:48'),
(156, 57, NULL, 'Bancada SOB MEDIDA Inox Fabricada em aço inox aisi 201, chapa 0,80mm. Com respaldo frontal, lateral direita e esquerda. Com paneleiro liso inferior reforçado. Medidas: 1200x820x900', 1.00, 954.20, 954.20, '2026-03-30 13:13:48'),
(157, 57, NULL, 'Prateleira inox Fabricada em aço inox aisi 430, chapa 0,80mm com mão francesa em aço inox. medidas: 770x300', 2.00, 269.65, 539.30, '2026-03-30 13:13:48'),
(158, 57, NULL, 'Prateleira inox Fabricada em aço inox aisi 430, chapa 0,80mm com mão francesa em aço inox. medidas: 1900x250', 1.00, 543.40, 543.40, '2026-03-30 13:13:48'),
(159, 60, NULL, 'Bandeja simples. Com dobra apenas em 2 lados. \nChapa 1.2mm. \n\nMedidas: 1720x530x40', 1.00, 496.00, 496.00, '2026-03-30 16:27:26'),
(160, 61, NULL, 'Suporte para resistência infravermelho.', 1.00, 0.00, 0.00, '2026-03-31 12:23:50'),
(161, 61, NULL, 'Suporte para resistencia infraveremlo', 1.00, 0.00, 0.00, '2026-03-31 12:23:50'),
(162, 62, NULL, 'Bancada ema ço inox aisi 304, chapa 0,80mm. Com paneleiro liso inferior. Prateleira superior, codimentadora refrigerada para gns 1/3x150mm', 1.00, 0.00, 0.00, '2026-03-31 12:55:32'),
(163, 62, NULL, 'Pista aquecida ema ço inox aisi 304.\nMedidas: 1000x400\n\n220v', 1.00, 0.00, 0.00, '2026-03-31 12:55:32'),
(164, 63, NULL, 'TOASTER 0625', 1.00, 11790.00, 11790.00, '2026-03-31 13:31:13'),
(165, 63, NULL, 'MANTENEDOR DE PROTEINA 8GNS\nCOM CAPACIDADE PARA 08 CUBAS GNS 1/3X65MM AÇO INOX. CONTROLADOR DIGITAL. PÉS DE APOIO NIVELADOR. 220V. TEMPERATURA DE 50º À 100º GRAUS; MEDIDAS: 910x330X380', 1.00, 7095.00, 7095.00, '2026-03-31 13:31:13'),
(166, 63, NULL, 'BASE REFRIGERADA\nFABRICADO EM AÇO INOX AISI 430, CHAPA INOX INTERNO E EXTERNO. CONTÉM 4 GAVETAS REFRIGERADAS . COM SAPATA NIVELADORA EM NYLON. ISOLAMENTO EM POLIORETANO INJETADO + EPS; TEMPERATURA: +1 A +7 GRAUS. CONTROLADOR DIGITAL REFRIGERAÇÃO POR AR FORÇADO NO BALCÃO. 220V MEDIDAS: 1500X800X700', 1.00, 9980.00, 9980.00, '2026-03-31 13:31:13'),
(167, 64, NULL, 'BASE REFRIGERADA\nFABRICADO EM AÇO INOX AISI 430, CHAPA INOX INTERNO E EXTERNO. CONTÉM 4 GAVETAS REFRIGERADAS . COM SAPATA NIVELADORA EM NYLON. ISOLAMENTO EM POLIORETANO INJETADO + EPS; TEMPERATURA: +1 A +7 GRAUS. CONTROLADOR DIGITAL REFRIGERAÇÃO POR AR FORÇADO NO BALCÃO. 220V MEDIDAS: 1500X800X700', 1.00, 9980.00, 9980.00, '2026-03-31 13:42:03'),
(168, 64, NULL, 'MANTENEDOR DE PROTEINA 8GNS\nCOM CAPACIDADE PARA 08 CUBAS GNS 1/3X65MM AÇO INOX. CONTROLADOR DIGITAL. PÉS DE APOIO NIVELADOR. 220V. TEMPERATURA DE 50º À 100º GRAUS; MEDIDAS: 910x330X380', 1.00, 7095.00, 7095.00, '2026-03-31 13:42:03'),
(169, 64, NULL, 'TOASTER 0625', 1.00, 11790.00, 11790.00, '2026-03-31 13:42:03'),
(170, 65, NULL, 'BANCADA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, ESPESSURA 0,80MM CONTEM DOIS BOJOS NAS MEDIDAS 50X40X25, 02 PRATELEIRAS INFERIORES, 04 GAVETAS, SOB ESTRUTURA TUBULAR DE 38 MM, DOTADA DE SAPATA NIVELADORA DE NYLON.  CMEDIDAS:1800X520X900', 1.00, 3000.00, 3000.00, '2026-04-06 08:46:07'),
(171, 65, NULL, 'Valvula de acionamento via joelho. \nPara ficar ao lado esquerdo da bancada', 1.00, 180.00, 180.00, '2026-04-06 08:46:07'),
(172, 66, NULL, 'Balcão SelfService Fabricado em aço inox aisi 201, chapa 0,80mm. Estrutura tubular de 38mm. Com banho maria a seco central, capacidade de 16gns 1/2x150mm. Suporte para lâmpadas aquecidas infravermelho (2 unidades) ao lado direito. Com capacidade para 2 cubas gns 1/2x150mm; Equipamento 220v; Dividido em 3 modulos, sendo 1 de 60x1150 1 de 1150x2700 1 de 1150x800 Possui prateleira lisa inferior à 50 cm acima do tampo; Prateleira lisa inferior à 200mm acima do piso. Medidas finais: 3200x1150x900', 1.00, 7416.00, 7416.00, '2026-04-06 09:21:32'),
(173, 67, NULL, 'Bancada\ncom cuba\nFabricado em aço inox aisi 201, chapa 0,80mm.\nEstrutura tubular de 38mm, possui rodobanca frontal\ncom.paneleiro liso inferior, dotado de sapara niveladora\nem nylon. Com cuba 60x40x40 lado esquerdo( à 60cm\nno eixo). Medidas: 2000x600x900', 1.00, 3290.00, 3290.00, '2026-04-06 10:18:28'),
(174, 67, NULL, 'Prateleira\nPerfurada\nFabricada em aço inox aisi 201, chapa 0,80mm. Com 0\nmão francesas em aço inox. Medidas: 2000x350', 1.00, 880.00, 880.00, '2026-04-06 10:18:28'),
(175, 67, NULL, 'Prateleira\nlisa\nFabricada em aço inox aisi 201, chapa 0,80mm. com 02\nmão francesas. Medidas: 820x280', 3.00, 440.00, 1320.00, '2026-04-06 10:18:28'),
(176, 67, NULL, 'Bancada\nem aço\ninox\nFabricada em aço inox aisi 201, chapa 0,80mm.\nEstrutura tubular de 38mm, possui rodobanca frontal\ncom 2 prateleira liso inferior, dotado de sapara\nniveladora em nylon. Meddias: 1550x600x900', 1.00, 2150.00, 2150.00, '2026-04-06 10:18:28'),
(177, 67, NULL, 'Prateleira\nlisa\nFabricada em aço inox aisi 201, chapa 0,80mm. com 02\nmão francesas. Com 45 graus. Medida 1050 x 200projeto', 2.00, 440.00, 880.00, '2026-04-06 10:18:28'),
(178, 68, NULL, 'IRÁ SER FABRICADO 2 GAVETAS PARA A BASE REFRIGERADA DO CLIENTE. PORTA A SER TROCADA SERÁ NO LADO DIREITO DA BASE. MEDIDA DA BASE DO CLIENTE: 1800C / 730L / 700A', 1.00, 930.00, 930.00, '2026-04-06 10:40:30'),
(179, 69, NULL, 'MESA PARA HAMBURGUERIA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. COM SAPATA NIVELADORA EM NYLON. SUPORTE SUPERIOR PARA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) E NO TAMPO DA MESA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6). PRATELEIRA LISA SUPERIOR. COM SUPORTE PARA MOLHEIRA, TAMPO AQUECIDO NOS 2 LADOS DE TRABALHO, COM 02 LAMPADAS AQUECIMENTO INFRAVERMELHO SUPERIOR. 04 GAVETAS PARA EMBALAGENS. NICHO PARA CAIXAS PLASTICAS, CAPACIDADE PARA 04 CAIXAS. 220V. MEDIDAS: 2200X900X900 OBS.: CUBAS INCLUSAS', 1.00, 6730.00, 6730.00, '2026-04-06 10:42:31'),
(180, 69, NULL, 'MESA DE PARTIDA - NICHO PARA EMBALAGENS - PRATELEIRA SUPERIOR NO COMPRIMENTO DA MESA, COM DUAS LAMPADAS DE AQUECIMENTO, COM 2 PANELEIROS INFERIORES. MEDIDAS: 1000C x 900A x 900L', 1.00, 3800.00, 3800.00, '2026-04-06 10:42:31'),
(181, 70, NULL, 'MESA PARA HAMBURGUERIA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. COM SAPATA NIVELADORA EM NYLON. SUPORTE SUPERIOR PARA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) E NO TAMPO DA MESA 5 CUBAS 1/3x100 (MEDIA 32,5X17,6) BANHO MARIA. PRATELEIRA LISA SUPERIOR. COM SUPORTE PARA MOLHEIRA, TAMPO AQUECIDO NOS 2 LADOS DE TRABALHO, COM 02 LAMPADAS AQUECIMENTO INFRAVERMELHO SUPERIOR. 04 GAVETAS PARA EMBALAGENS. NICHO PARA CAIXAS PLASTICAS CAPACIDADE PARA 04 CAIXAS. 220V. MEDIDAS: 2200X900X900 OBS.: CUBAS INCLUSAS.', 1.00, 7530.00, 7530.00, '2026-04-06 10:47:40'),
(182, 71, NULL, 'ESTAÇÃO PARA HAMBURGUERIA\nBancada SOB MEDIDA Inox MESA DE HAMBURGUERIA - MESA INOX LISA DE PRODUÇÃO 1500X700X900 - PISTA QUENTE NA AREA DE TRABALHO - PISTA PARA 06 Gns 1/4 100 – SENDO DUAS CUBAS PARA BANHO MARIA. - 1 PRATELEIRA INFERIOR - MONTANTE DE DOIS PLANOS - NICHO PARA SUPORTE DE BISNAGAS - NICHO PARA CONSERVADOR DE PROTEINAS - NICHO PARA CUBS GNS ¼ NA PRATELEIRA SUPERIOR, MESA COM RODÍZIOS COM FREIO. Bancada SOB MEDIDA Inox - MESA DE PARTIDA 800X700X900 - NICHO PARA EMBALAGENS - PRATELEIRA SUPERIOR COM DUAS LAMPAD', 1.00, 10200.00, 10200.00, '2026-04-06 10:50:43'),
(183, 71, NULL, 'TOASTER 0425', 1.00, 6398.40, 6398.40, '2026-04-06 10:50:43'),
(184, 72, NULL, 'BASE REFRIGERADA\nBASE REFRIGERADA 6 GAVETAS PARA CONGELAMENTO Construção em Aço inox; Controlador de temperatura digital Temperatura média de trabalho -10 a -18ºC Possui isolamento em Polioretano Injetado; 100% inox, interno e externo; Processo de fabricação em corte a laser; Com 4 rodízio giratórios com freio; Tensão(v) 220. Altura Final terá que ter 70cm. Medida: 2300C x 700A x 800L', 1.00, 14700.00, 14700.00, '2026-04-06 10:53:28'),
(185, 72, 14, 'Mantenedor Proteinas 8GNs 220v', 1.00, 7095.00, 7095.00, '2026-04-06 10:53:28'),
(186, 72, NULL, 'Mesa Aço Inox\nMESA LISA EM INOX COM RODOBANCA FABRICADO EM AÇO INOX AISI 430, CHAPA ESPESSURA 0,80MM ,DOTADA DE SAPATA NIVELADORA DE NYLON. COM TAMPO AQUECIDO NA FRENTE MEDIDAS: 1500X700X900', 1.00, 2500.00, 2500.00, '2026-04-06 10:53:28'),
(187, 73, NULL, 'Estante 4\nplanos\nFabricada em aço inox aisi 201, chapa\n0,80mm Estrtura tubular de 38mm. Com 4\nplanos lisos; medidas: 800x400x1800', 1.00, 1590.00, 1590.00, '2026-04-08 07:16:47'),
(188, 73, NULL, 'Bancada com\ncuba\nFabricada em aço inox aisi 201,chapa\n0,80mm. Estrutura tubular de 38mm,\nprateleira perfurada inferior à 150m acima\ndo piso. Cuba 600x500x400 Medidas:\n1970x600x900\n\nBancada com grau.', 1.00, 2630.00, 2630.00, '2026-04-08 07:16:47'),
(189, 73, NULL, 'Mesa Lisa\nFabricada em aço inox aisi 201,chapa\n0,80mm. Estrutura tubular de 38mm,\nprateleira lisa inferior à 150m acima do\npiso. Medidas: 1650x500x900', 1.00, 1663.00, 1663.00, '2026-04-08 07:16:47'),
(190, 73, NULL, 'Mesa Lisa\nFabricada em aço inox aisi 201,chapa\n0,80mm. Estrutura tubular de 38mm,\nprateleira lisa inferior à 150m acima do\npiso. Medidas: 1650x450x900', 1.00, 1663.00, 1663.00, '2026-04-08 07:16:47'),
(191, 73, NULL, 'Bancada com\ncuba em aço\ninox\nFabricada em aço inox aisi 201,chapa\n0,80mm. Cuba à95cm da direita para\nesquerda. Estrutura tubular de 38mm,\nprateleira lisa inferior à 150m acima do\npiso. Medidas: 1600x600x900', 1.00, 2020.00, 2020.00, '2026-04-08 07:16:47'),
(192, 73, NULL, 'Conservador de\nfrituras SF50 500w 220v Medidas: 500x500x700', 1.00, 1980.00, 1980.00, '2026-04-08 07:16:47'),
(193, 73, NULL, 'Churrasqueira\nEspetinho\nFabricada em aço inox aisi 304,chapa\n0,80mm. Pés em tubo quadrado 40x40;\nCom 02 andares para espetos. Braseiro\nembutido com pedras refratária. Isolamento\nduplo para temperatura. Medidas:\n1150x400x900', 1.00, 2250.00, 2250.00, '2026-04-08 07:16:47'),
(194, 73, NULL, 'Fritadeira\neletricca 6000w\nCuba dupla em aço inox aisi 304; Modelo\nde pedestal. Com 2 tanques individuais.\nCom 2 cestos para escorrer frituras. 6000w\n220v.\n\nGuilherme Está desenvolvendo.', 1.00, 2450.00, 2450.00, '2026-04-08 07:16:47'),
(195, 73, NULL, 'Coifa em aço\ninox\nFabricada em aço inox aisi 201, com\niluminação interna. Dutos quadrados de\n30x30cm. Fabricação + Instalação. Com\nexaustor de 500mm industrial 220v.\nRedução de quadrado para redondo. 3,5\nmetrod duto de 300 Medidas:2800x800x500', 1.00, 13180.00, 13180.00, '2026-04-08 07:16:47'),
(196, 74, NULL, 'Mesa\nMontagem\nde centro.\nFabricada em aço inox AISI 430, chapa 0,80 mm\nEstrutura tubular reforçada de 38 mm Base para rodizio\ngiratório de 3\" Suporte embutido no tampo para 06\ncubas gastronômicas GN 1/3, Refrigerada. Com\nUnidade refrigeração 220v. Suporte superior para 06\ncubas GN 1/3 Prateleira superior lisa Dimensões: 1400\nx 400 x 500 mm Suporte para molheiras Tampo\naquecido 220v Sistema de aquecimento superior com\n02 lâmpadas infravermelho 220v Caixa para conservar\nbatatas embutida no tampo. 02 gavetas frontais para\narmazenamento de embalagens Nicho inferior para\ncaixas plásticas Capacidade: até 04 caixas\nAlimentação elétrica: 220V Mesa desmontada em 2\npartes, Prateleira superiores e mesa inferior. Espeço\npara colocar refrigerador em aixo da bancada.\nDimensões da Mesa: 2600 x 800 x 900 mm (L x P x A)', 1.00, 11035.00, 11035.00, '2026-04-09 09:47:41'),
(197, 75, NULL, 'balcão refrigerado\nBALCÃO REFRIGERADO 1 PORTA: CONSTRUÇÃO EM AÇO INOX INTERNO E EXTERNO, PRATELEIRAS INTERNAS E EXTERNAS EM CORTE A LASER, GABINETE EM 100% DE POLIORETANO INJETADO, REFRIGERAÇÃO POR AR FORÇADO, CONTROLADOR DIGITAL, SAPATA NIVELADORA REGULÁVEL. MEDIDA: 1100C x 610A x 650L', 1.00, 7250.00, 7250.00, '2026-04-14 13:13:08'),
(198, 76, NULL, 'Mesa com 2 Lâmpadas de aquecimento e prateleira superior, com nichos de embalagens somente de um lado e aquecimento no outro lado da mesa: R$ 3.000,00 MEDIDA: 1200C x 600L x 900A', 1.00, 3000.00, 3000.00, '2026-04-14 13:16:02'),
(199, 77, NULL, 'BASE REFRIGERADA\nBASE REFRIGERADA 4 GAVETAS', 1.00, 8732.60, 8732.60, '2026-04-14 13:18:28'),
(200, 77, NULL, 'ESTAÇÃO PARA HAMBURGUERIA\nMUNDO ANIMADO', 1.00, 4650.00, 4650.00, '2026-04-14 13:18:28'),
(201, 78, NULL, 'MESA DE MONTAGE MODELO ILHA FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. CONTEM : - DUAS PRATELEIRAS INFERIORES - SUPORTE PARA CESTO DE PÃES, CAPACIDADE PARA 04 CESTOS -DUAS GAVETAS DE MIGALHAS AMBOS OS LADOS - TAMPO AQUECIDO NA AREA DE TRABALHO -07 GNS 1/3X100 REFRIGERADA - SUPORTE SUPERIOR PARA 6 GNS 1/3X100 - PORTA TALHERES (EM AMBOS OS LADOS DA MONTAGEM) - SUPORTE PARA ESPATULAS ( EM AMBOS OS LADOS DA MONTAGEM) - SUPORTE PARA 02 LAMPADAS DE AQUECIMENTO - DUAS PRATELIRAS SUPERIORES - DUAS PANELEIROS INFERIORES. - SUPORTE PARA 07 BISNAGA DE MOLHO - CONTEM UMA CHAPA FECHANDO NA PARTE DA LAMPADAS DA GNS. MEDIDAS:2650X1150X900', 1.00, 16380.00, 16380.00, '2026-04-14 20:01:07'),
(202, 78, NULL, 'TOASTER 0425', 2.00, 6350.00, 12700.00, '2026-04-14 20:01:07'),
(203, 78, 12, 'Mantenedor Proteinas 6GNs 220v', 1.00, 5489.00, 5489.00, '2026-04-14 20:01:07'),
(204, 78, NULL, 'FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM A PRIMEIRA CONTEM FRUROS, E UM ESCORREDOR DE PRATOS, A SEGUNDA FUROS, PRATELEIRA DE SOBREPOR MEDIDAS:1920X400', 1.00, 1400.00, 1400.00, '2026-04-14 20:01:07'),
(205, 79, NULL, 'CONSERVADOR DE FRITURAS CF-50', 1.00, 1900.00, 1900.00, '2026-04-15 10:34:34'),
(206, 79, NULL, 'BASE REFRIGERADA 6 GAVETAS, Construção em Aço inox; Controlador de temperatura digital Temperatura média de trabalho 1 a 7ºC Possui isolamento em Polioretano Injetado; 100% inox, interno e externo; Processo de fabricação em corte a laser; Sapata niveladora em nylon; Tensão(v) 220 MEDIDA: 1900x700x800 COM 6 CUBAS DE 1/1X150', 1.00, 10300.00, 10300.00, '2026-04-15 10:34:34'),
(207, 79, NULL, 'ESTAÇÃO DE HAMBURGEURIA: Bancada SOB MEDIDA Inox MESA DE HAMBURGUERIA - MESA INOX LISA DE PRODUÇÃO 1500X700X900 - PISTA QUENTE NA AREA DE TRABALHO - PISTA PARA 06 Gns 1/4 100 – SENDO DUAS CUBAS PARA BANHO MARIA. - PRATELEIRA INFERIOR MONTANTE DE TRÊS PLANOS - 4 ANDARES PARA PORTA PÃES - NICHO PARA SUPORTE DE BISNAGAS - NICHO PARA CONSERVADOR DE PROTEINAS - NICHO PARA CUBS GNS ¼ NA PRATELEIRA SUPERIOR Bancada SOB MEDIDA Inox - MESA DE PARTIDA 800X700X900 - NICHO PARA EMBALAGENS - PRATELEIRA SUPERIOR COM TRÊS LAMPADAS DE AQUECIMENTO E 2 PRATELEIRAS INFERIORES Bancada SOB MEDIDA Inox - MESA PARA APOIO DE PÃES 700x700 - COM 2 PRATELEIRAS INFERIORES', 1.00, 11788.00, 11788.00, '2026-04-15 10:34:34'),
(208, 79, NULL, 'CHAPA À GÁS: CHAPA A GAS 122X73CM 19MM GAS GLP HIGH PRODUCTION 24133', 1.00, 6537.00, 6537.00, '2026-04-15 10:34:34'),
(209, 79, NULL, 'TOASTER 0625', 1.00, 8750.00, 8750.00, '2026-04-15 10:34:34'),
(210, 80, NULL, 'Bancada SOB MEDIDA Inox MESA DE HAMBURGUERIA - MESA INOX LISA DE PRODUÇÃO 1500X700X900 - PISTA QUENTE NA AREA DE TRABALHO - PISTA PARA 06 Gns 1/4 x 100 – SENDO DUAS CUBAS PARA BANHO MARIA. - 2 PRATELEIRA INFERIOR - MONTANTE DE 3 PLANOS 4 ANDARES DE PORTA PÃES- NICHO PARA SUPORTE DE BISNAGAS - NICHO PARA CONSERVADOR DE PROTEINAS - NICHO PARA CUBS GNS ¼ NA PRATELEIRA SUPERIOR Bancada SOB MEDIDA Inox - MESA DE PARTIDA 800X700X900 - NICHO PARA EMBALAGENS - 1 PRATELEIRA SUPERIOR COM DUAS LAMPADAS DE AQUECIMENTO, COM 2 PRATELEIRA INFERIOR Bancada SOB MEDIDA Inox - MESA PARA APOIO DE PÃES 700x700 - 2 PRATEIRA INFERIOR', 1.00, 10700.00, 10700.00, '2026-04-15 10:38:47'),
(211, 81, NULL, 'TOASTER 0425', 1.00, 5715.00, 5715.00, '2026-04-15 10:44:43'),
(212, 82, NULL, 'ESTAÇÃO PARA HAMBURGUERIA\nMesa Aço Inox MESA PARA HAMBURGUERIA EM AÇO INOX FABRICADO EM AÇO INOX AISI 430, CHAPA 0,80MM. COM SAPATA NIVELADORA EM NYLON. SUPORTE PARA 6 CUBAS 1/3x100 E NO TAMPO DA MESA 6 CUBAS 1/3X100 EM BANHO MARIA. PRATELEIRA LISA SUPERIOR. COM SUPORTE PARA MOLHEIRA, TAMPO AQUECIDO LADO DIREITO NA PONTA, COM 02 LAMPADAS AQUECIMENTO INFRAVERMELHO SUPERIOR. 04 GAVETAS PARA EMBALAGENS. NICHO PARA CAIXAS PLASTICAS, CAPACIDADE PARA 04 CAIXAS. 220V, COM 2 PRATELERIAS INFERIORES. MEDIDAS: 2200X900X900', 1.00, 8590.00, 8590.00, '2026-04-15 10:47:59'),
(213, 82, NULL, 'MANTENEDOR DE PROTEINA 4GNS\nConstrução em Aço inox; Controlador de temperatura digital Controle individual por seção. Temperatura média de trabalho 65ºC Ajuste de temperatura de 50º a 100ºC Protege contra odores e contaminações, garantindo hambúrgueres suculentos e seguros Ideal para manter o padrão em estabelecimentos de fast-food e restaurantes Pés com regulagem de altura Manta isolamento em fibra vidro e cerâmica térmica; Cuba Gn em aço inox; Tensão(v) 220', 1.00, 2752.00, 2752.00, '2026-04-15 10:47:59'),
(214, 83, NULL, 'CONSERVADOR DE FRITURAS CF-50', 1.00, 1900.00, 1900.00, '2026-04-15 11:53:33'),
(215, 83, NULL, 'BASE REFRIGERADA 6 GAVETAS - PARA CONGELAMENTO	Construção em Aço inox; Controlador de temperatura digital Temperatura média de trabalho 1 a 7ºC Possui isolamento em Polioretano Injetado; 100% inox, interno e externo; Processo de fabricação em corte a laser; Sapata niveladora em nylon; Tensão(v) 220 MEDIDA: 1900x700x800 COM 6 CUBAS DE 1/1X150', 1.00, 10300.00, 10300.00, '2026-04-15 11:53:33'),
(216, 83, NULL, 'TOASTER 0625', 1.00, 8750.00, 8750.00, '2026-04-15 11:53:33'),
(217, 83, NULL, 'Bancada SOB MEDIDA Inox MESA DE HAMBURGUERIA - MESA INOX LISA DE PRODUÇÃO 1500X700X900 - PISTA QUENTE NA AREA DE TRABALHO - PISTA PARA 06 Gns 1/4 100 – SENDO DUAS CUBAS PARA BANHO MARIA. - PRATELEIRA INFERIOR MONTANTE DE TRÊS PLANOS - 4 ANDARES PARA PORTA PÃES - NICHO PARA SUPORTE DE BISNAGAS - NICHO PARA CONSERVADOR DE PROTEINAS - NICHO PARA CUBS GNS ¼ NA PRATELEIRA SUPERIOR Bancada SOB MEDIDA Inox - MESA DE PARTIDA 800X700X900 - NICHO PARA EMBALAGENS - PRATELEIRA SUPERIOR COM TRÊS LAMPADAS DE AQUECIMENTO E 2 PRATELEIRAS INFERIORES Bancada SOB MEDIDA Inox - MESA PARA APOIO DE PÃES 700x700 - COM 2 PRATELEIRAS INFERIORES', 1.00, 11788.00, 11788.00, '2026-04-15 11:53:33'),
(218, 83, NULL, 'CHAPA À GÁS	CHAPA A GAS 122X73CM 19MM GAS GLP HIGH PRODUCTION 24133', 1.00, 6537.00, 6537.00, '2026-04-15 11:53:33');

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `centro_custo`
--
ALTER TABLE `centro_custo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `cfop`
--
ALTER TABLE `cfop`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`);

--
-- Índices de tabela `clientes`
--
ALTER TABLE `clientes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_razao_social` (`razao_social`(191)),
  ADD KEY `idx_cnpj_cpf` (`cnpj_cpf`);

--
-- Índices de tabela `componentes_produto`
--
ALTER TABLE `componentes_produto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `estrutura_id` (`estrutura_id`),
  ADD KEY `fk_componentes_insumo` (`insumo_id`);

--
-- Índices de tabela `conciliacao`
--
ALTER TABLE `conciliacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `pagamento_id` (`pagamento_id`);

--
-- Índices de tabela `condicoes_pagamento`
--
ALTER TABLE `condicoes_pagamento`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_nome` (`nome`);

--
-- Índices de tabela `condicoes_parcelas`
--
ALTER TABLE `condicoes_parcelas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_condicao` (`condicao_id`);

--
-- Índices de tabela `condicoes_restricoes`
--
ALTER TABLE `condicoes_restricoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_condicao_pessoa` (`condicao_id`,`pessoa_id`),
  ADD KEY `pessoa_id` (`pessoa_id`);

--
-- Índices de tabela `contas_bancarias`
--
ALTER TABLE `contas_bancarias`
  ADD PRIMARY KEY (`id`),
  ADD KEY `empresa_id` (`empresa_id`),
  ADD KEY `idx_banco` (`banco`);

--
-- Índices de tabela `contas_pagar`
--
ALTER TABLE `contas_pagar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `centro_custo_id` (`centro_custo_id`),
  ADD KEY `idx_cp_status` (`status`);

--
-- Índices de tabela `contas_receber`
--
ALTER TABLE `contas_receber`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cr_venda` (`venda_id`),
  ADD KEY `idx_cr_cliente` (`cliente_id`),
  ADD KEY `idx_cr_status` (`status`),
  ADD KEY `tipo_caixa_id` (`tipo_caixa_id`);

--
-- Índices de tabela `contatos`
--
ALTER TABLE `contatos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pessoa` (`pessoa_id`);

--
-- Índices de tabela `empresas`
--
ALTER TABLE `empresas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `cnpj` (`cnpj`),
  ADD KEY `idx_razao` (`razao_social`),
  ADD KEY `idx_cnpj` (`cnpj`),
  ADD KEY `idx_matriz` (`matriz_id`);

--
-- Índices de tabela `empresas_enderecos`
--
ALTER TABLE `empresas_enderecos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresa_id`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Índices de tabela `empresas_nfe_config`
--
ALTER TABLE `empresas_nfe_config`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_empresa` (`empresa_id`);

--
-- Índices de tabela `estrutura_produto`
--
ALTER TABLE `estrutura_produto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `familias_produtos`
--
ALTER TABLE `familias_produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_grupo` (`grupo_id`);

--
-- Índices de tabela `fluxo_caixa`
--
ALTER TABLE `fluxo_caixa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_fc_tipo_ref` (`referencia_tipo`,`referencia_id`);

--
-- Índices de tabela `grupos_permissoes`
--
ALTER TABLE `grupos_permissoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_grupo_permissao` (`grupo_id`,`permissao_id`),
  ADD KEY `idx_grupo` (`grupo_id`),
  ADD KEY `idx_permissao` (`permissao_id`);

--
-- Índices de tabela `grupos_produtos`
--
ALTER TABLE `grupos_produtos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `setor_id` (`setor_id`),
  ADD KEY `idx_empresa` (`empresa_id`);

--
-- Índices de tabela `grupos_usuarios`
--
ALTER TABLE `grupos_usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`),
  ADD KEY `idx_nome` (`nome`),
  ADD KEY `idx_ativo` (`ativo`);

--
-- Índices de tabela `insumos`
--
ALTER TABLE `insumos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_insumo_nome` (`nome`),
  ADD KEY `idx_insumo_fornecedor` (`fornecedor`);

--
-- Índices de tabela `logs_alteracoes`
--
ALTER TABLE `logs_alteracoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_entidade` (`tipo_entidade`,`entidade_id`);

--
-- Índices de tabela `logs_exclusao_vendas`
--
ALTER TABLE `logs_exclusao_vendas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `logs_retorno_etapa`
--
ALTER TABLE `logs_retorno_etapa`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_os` (`os_id`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Índices de tabela `logs_senha`
--
ALTER TABLE `logs_senha`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_data` (`created_at`);

--
-- Índices de tabela `logs_sistema`
--
ALTER TABLE `logs_sistema`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_logs_entidade` (`entidade`,`entidade_id`);

--
-- Índices de tabela `naturezas_operacao`
--
ALTER TABLE `naturezas_operacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cfop` (`cfop`);

--
-- Índices de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_notif_usuario_chave` (`usuario_id`,`chave_evento`),
  ADD KEY `idx_notif_usuario_lida` (`usuario_id`,`lida`);

--
-- Índices de tabela `notificacoes_envios`
--
ALTER TABLE `notificacoes_envios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notificacao_id` (`notificacao_id`),
  ADD KEY `idx_envio_status` (`status`,`canal`);

--
-- Índices de tabela `orcamentos`
--
ALTER TABLE `orcamentos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_numero` (`numero`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_data` (`data_orcamento`);

--
-- Índices de tabela `orcamentos_itens`
--
ALTER TABLE `orcamentos_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `idx_orcamento` (`orcamento_id`);

--
-- Índices de tabela `ordens_servico`
--
ALTER TABLE `ordens_servico`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `venda_id` (`venda_id`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `idx_numero` (`numero`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_prioridade` (`prioridade`),
  ADD KEY `idx_data_inicio` (`data_inicio`);

--
-- Índices de tabela `os_arquivos`
--
ALTER TABLE `os_arquivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_os` (`os_id`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Índices de tabela `os_checkup_qualidade`
--
ALTER TABLE `os_checkup_qualidade`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_os_item` (`os_id`,`venda_item_id`),
  ADD KEY `venda_item_id` (`venda_item_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `os_etapas_producao`
--
ALTER TABLE `os_etapas_producao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_os_etapa` (`os_id`,`etapa`);

--
-- Índices de tabela `os_historico_status`
--
ALTER TABLE `os_historico_status`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_os` (`os_id`);

--
-- Índices de tabela `os_itens`
--
ALTER TABLE `os_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_os_item` (`os_id`),
  ADD KEY `idx_os_item_produto` (`produto_id`);

--
-- Índices de tabela `os_materiais`
--
ALTER TABLE `os_materiais`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_os` (`os_id`),
  ADD KEY `idx_processo` (`processo`);

--
-- Índices de tabela `os_observacoes`
--
ALTER TABLE `os_observacoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_os` (`os_id`),
  ADD KEY `idx_tipo_setor` (`tipo_setor`);

--
-- Índices de tabela `os_projetos`
--
ALTER TABLE `os_projetos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `usuario_responsavel_id` (`usuario_responsavel_id`),
  ADD KEY `idx_os_projeto` (`os_id`),
  ADD KEY `idx_status` (`status`);

--
-- Índices de tabela `os_projeto_componentes`
--
ALTER TABLE `os_projeto_componentes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_projeto_componentes` (`projeto_id`);

--
-- Índices de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pg_conta` (`conta_receber_id`),
  ADD KEY `usuario_id` (`usuario_id`);

--
-- Índices de tabela `permissoes`
--
ALTER TABLE `permissoes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_permissao` (`modulo`,`recurso`,`acao`),
  ADD KEY `idx_modulo` (`modulo`),
  ADD KEY `idx_recurso` (`recurso`);

--
-- Índices de tabela `pessoas`
--
ALTER TABLE `pessoas`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tipo` (`tipo_pessoa`),
  ADD KEY `idx_razao` (`razao_social`),
  ADD KEY `idx_cnpj` (`cnpj_cpf`);

--
-- Índices de tabela `pessoas_atributos`
--
ALTER TABLE `pessoas_atributos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_pessoa_atributo` (`pessoa_id`,`atributo`),
  ADD KEY `idx_pessoa` (`pessoa_id`);

--
-- Índices de tabela `pessoas_classificacoes`
--
ALTER TABLE `pessoas_classificacoes`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `plano_contas`
--
ALTER TABLE `plano_contas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_codigo` (`codigo`),
  ADD KEY `idx_pai` (`pai_id`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Índices de tabela `processos_produtivos`
--
ALTER TABLE `processos_produtivos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `os_id` (`os_id`);

--
-- Índices de tabela `produtos`
--
ALTER TABLE `produtos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `codigo` (`codigo`),
  ADD KEY `idx_codigo` (`codigo`),
  ADD KEY `idx_nome` (`nome`(191));

--
-- Índices de tabela `regras_tributacao`
--
ALTER TABLE `regras_tributacao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_estados` (`estado_origem`,`estado_destino`);

--
-- Índices de tabela `sessoes`
--
ALTER TABLE `sessoes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_expiracao` (`data_expiracao`);

--
-- Índices de tabela `setores_estoque`
--
ALTER TABLE `setores_estoque`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_empresa` (`empresa_id`),
  ADD KEY `idx_parent` (`parent_id`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Índices de tabela `tempo_producao`
--
ALTER TABLE `tempo_producao`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`);

--
-- Índices de tabela `tipos_caixa`
--
ALTER TABLE `tipos_caixa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nome` (`nome`);

--
-- Índices de tabela `tipos_documento_fiscal`
--
ALTER TABLE `tipos_documento_fiscal`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_codigo` (`codigo`);

--
-- Índices de tabela `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_tipo` (`tipo`);

--
-- Índices de tabela `usuarios_2fa`
--
ALTER TABLE `usuarios_2fa`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_usuario` (`usuario_id`);

--
-- Índices de tabela `usuarios_expedientes`
--
ALTER TABLE `usuarios_expedientes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_usuario_data` (`usuario_id`,`data_referencia`);

--
-- Índices de tabela `usuarios_expediente_logs`
--
ALTER TABLE `usuarios_expediente_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_expediente_log_expediente` (`expediente_id`),
  ADD KEY `idx_usuario_registro` (`usuario_id`,`registrado_em`);

--
-- Índices de tabela `usuarios_grupos`
--
ALTER TABLE `usuarios_grupos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_usuario_grupo` (`usuario_id`,`grupo_id`),
  ADD KEY `idx_usuario` (`usuario_id`),
  ADD KEY `idx_grupo` (`grupo_id`);

--
-- Índices de tabela `vendas`
--
ALTER TABLE `vendas`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `numero` (`numero`),
  ADD KEY `orcamento_id` (`orcamento_id`),
  ADD KEY `cliente_id` (`cliente_id`),
  ADD KEY `usuario_id` (`usuario_id`),
  ADD KEY `idx_numero` (`numero`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `idx_data` (`data_venda`);

--
-- Índices de tabela `vendas_itens`
--
ALTER TABLE `vendas_itens`
  ADD PRIMARY KEY (`id`),
  ADD KEY `produto_id` (`produto_id`),
  ADD KEY `idx_venda` (`venda_id`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `centro_custo`
--
ALTER TABLE `centro_custo`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `cfop`
--
ALTER TABLE `cfop`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de tabela `clientes`
--
ALTER TABLE `clientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de tabela `componentes_produto`
--
ALTER TABLE `componentes_produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=51;

--
-- AUTO_INCREMENT de tabela `conciliacao`
--
ALTER TABLE `conciliacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `condicoes_pagamento`
--
ALTER TABLE `condicoes_pagamento`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `condicoes_parcelas`
--
ALTER TABLE `condicoes_parcelas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `condicoes_restricoes`
--
ALTER TABLE `condicoes_restricoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contas_bancarias`
--
ALTER TABLE `contas_bancarias`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contas_pagar`
--
ALTER TABLE `contas_pagar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `contas_receber`
--
ALTER TABLE `contas_receber`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT de tabela `contatos`
--
ALTER TABLE `contatos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas`
--
ALTER TABLE `empresas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de tabela `empresas_enderecos`
--
ALTER TABLE `empresas_enderecos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `empresas_nfe_config`
--
ALTER TABLE `empresas_nfe_config`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `estrutura_produto`
--
ALTER TABLE `estrutura_produto`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `familias_produtos`
--
ALTER TABLE `familias_produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `fluxo_caixa`
--
ALTER TABLE `fluxo_caixa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `grupos_permissoes`
--
ALTER TABLE `grupos_permissoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1883;

--
-- AUTO_INCREMENT de tabela `grupos_produtos`
--
ALTER TABLE `grupos_produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de tabela `grupos_usuarios`
--
ALTER TABLE `grupos_usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de tabela `insumos`
--
ALTER TABLE `insumos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT de tabela `logs_alteracoes`
--
ALTER TABLE `logs_alteracoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `logs_exclusao_vendas`
--
ALTER TABLE `logs_exclusao_vendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `logs_retorno_etapa`
--
ALTER TABLE `logs_retorno_etapa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de tabela `logs_senha`
--
ALTER TABLE `logs_senha`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `logs_sistema`
--
ALTER TABLE `logs_sistema`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT de tabela `naturezas_operacao`
--
ALTER TABLE `naturezas_operacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=50;

--
-- AUTO_INCREMENT de tabela `notificacoes`
--
ALTER TABLE `notificacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3194;

--
-- AUTO_INCREMENT de tabela `notificacoes_envios`
--
ALTER TABLE `notificacoes_envios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1527;

--
-- AUTO_INCREMENT de tabela `orcamentos`
--
ALTER TABLE `orcamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de tabela `orcamentos_itens`
--
ALTER TABLE `orcamentos_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT de tabela `ordens_servico`
--
ALTER TABLE `ordens_servico`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT de tabela `os_arquivos`
--
ALTER TABLE `os_arquivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=106;

--
-- AUTO_INCREMENT de tabela `os_checkup_qualidade`
--
ALTER TABLE `os_checkup_qualidade`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT de tabela `os_etapas_producao`
--
ALTER TABLE `os_etapas_producao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=342;

--
-- AUTO_INCREMENT de tabela `os_historico_status`
--
ALTER TABLE `os_historico_status`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=80;

--
-- AUTO_INCREMENT de tabela `os_itens`
--
ALTER TABLE `os_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de tabela `os_materiais`
--
ALTER TABLE `os_materiais`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `os_observacoes`
--
ALTER TABLE `os_observacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de tabela `os_projetos`
--
ALTER TABLE `os_projetos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `os_projeto_componentes`
--
ALTER TABLE `os_projeto_componentes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pagamentos`
--
ALTER TABLE `pagamentos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de tabela `permissoes`
--
ALTER TABLE `permissoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=616;

--
-- AUTO_INCREMENT de tabela `pessoas`
--
ALTER TABLE `pessoas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT de tabela `pessoas_atributos`
--
ALTER TABLE `pessoas_atributos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pessoas_classificacoes`
--
ALTER TABLE `pessoas_classificacoes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `plano_contas`
--
ALTER TABLE `plano_contas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de tabela `processos_produtivos`
--
ALTER TABLE `processos_produtivos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `produtos`
--
ALTER TABLE `produtos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de tabela `regras_tributacao`
--
ALTER TABLE `regras_tributacao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de tabela `setores_estoque`
--
ALTER TABLE `setores_estoque`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de tabela `tempo_producao`
--
ALTER TABLE `tempo_producao`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `tipos_caixa`
--
ALTER TABLE `tipos_caixa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de tabela `tipos_documento_fiscal`
--
ALTER TABLE `tipos_documento_fiscal`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT de tabela `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de tabela `usuarios_2fa`
--
ALTER TABLE `usuarios_2fa`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `usuarios_expedientes`
--
ALTER TABLE `usuarios_expedientes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de tabela `usuarios_expediente_logs`
--
ALTER TABLE `usuarios_expediente_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=57;

--
-- AUTO_INCREMENT de tabela `usuarios_grupos`
--
ALTER TABLE `usuarios_grupos`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT de tabela `vendas`
--
ALTER TABLE `vendas`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=84;

--
-- AUTO_INCREMENT de tabela `vendas_itens`
--
ALTER TABLE `vendas_itens`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=219;

--
-- Restrições para tabelas despejadas
--

--
-- Restrições para tabelas `componentes_produto`
--
ALTER TABLE `componentes_produto`
  ADD CONSTRAINT `componentes_produto_ibfk_1` FOREIGN KEY (`estrutura_id`) REFERENCES `estrutura_produto` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_componentes_insumo` FOREIGN KEY (`insumo_id`) REFERENCES `insumos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `conciliacao`
--
ALTER TABLE `conciliacao`
  ADD CONSTRAINT `conciliacao_ibfk_1` FOREIGN KEY (`pagamento_id`) REFERENCES `pagamentos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `condicoes_parcelas`
--
ALTER TABLE `condicoes_parcelas`
  ADD CONSTRAINT `condicoes_parcelas_ibfk_1` FOREIGN KEY (`condicao_id`) REFERENCES `condicoes_pagamento` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `condicoes_restricoes`
--
ALTER TABLE `condicoes_restricoes`
  ADD CONSTRAINT `condicoes_restricoes_ibfk_1` FOREIGN KEY (`condicao_id`) REFERENCES `condicoes_pagamento` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `condicoes_restricoes_ibfk_2` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `contas_bancarias`
--
ALTER TABLE `contas_bancarias`
  ADD CONSTRAINT `contas_bancarias_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `contas_pagar`
--
ALTER TABLE `contas_pagar`
  ADD CONSTRAINT `contas_pagar_ibfk_1` FOREIGN KEY (`centro_custo_id`) REFERENCES `centro_custo` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `contas_receber`
--
ALTER TABLE `contas_receber`
  ADD CONSTRAINT `contas_receber_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `contas_receber_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `contas_receber_ibfk_3` FOREIGN KEY (`tipo_caixa_id`) REFERENCES `tipos_caixa` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `contatos`
--
ALTER TABLE `contatos`
  ADD CONSTRAINT `contatos_ibfk_1` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `empresas_enderecos`
--
ALTER TABLE `empresas_enderecos`
  ADD CONSTRAINT `empresas_enderecos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `empresas_nfe_config`
--
ALTER TABLE `empresas_nfe_config`
  ADD CONSTRAINT `empresas_nfe_config_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `estrutura_produto`
--
ALTER TABLE `estrutura_produto`
  ADD CONSTRAINT `estrutura_produto_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `familias_produtos`
--
ALTER TABLE `familias_produtos`
  ADD CONSTRAINT `familias_produtos_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `grupos_permissoes`
--
ALTER TABLE `grupos_permissoes`
  ADD CONSTRAINT `grupos_permissoes_ibfk_1` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `grupos_permissoes_ibfk_2` FOREIGN KEY (`permissao_id`) REFERENCES `permissoes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `grupos_produtos`
--
ALTER TABLE `grupos_produtos`
  ADD CONSTRAINT `grupos_produtos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `grupos_produtos_ibfk_2` FOREIGN KEY (`setor_id`) REFERENCES `setores_estoque` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `logs_alteracoes`
--
ALTER TABLE `logs_alteracoes`
  ADD CONSTRAINT `logs_alteracoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `logs_exclusao_vendas`
--
ALTER TABLE `logs_exclusao_vendas`
  ADD CONSTRAINT `logs_exclusao_vendas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `logs_retorno_etapa`
--
ALTER TABLE `logs_retorno_etapa`
  ADD CONSTRAINT `logs_retorno_etapa_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `logs_retorno_etapa_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `logs_senha`
--
ALTER TABLE `logs_senha`
  ADD CONSTRAINT `logs_senha_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `notificacoes`
--
ALTER TABLE `notificacoes`
  ADD CONSTRAINT `notificacoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `notificacoes_envios`
--
ALTER TABLE `notificacoes_envios`
  ADD CONSTRAINT `notificacoes_envios_ibfk_1` FOREIGN KEY (`notificacao_id`) REFERENCES `notificacoes` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `orcamentos`
--
ALTER TABLE `orcamentos`
  ADD CONSTRAINT `orcamentos_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `orcamentos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `orcamentos_itens`
--
ALTER TABLE `orcamentos_itens`
  ADD CONSTRAINT `orcamentos_itens_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `orcamentos_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `ordens_servico`
--
ALTER TABLE `ordens_servico`
  ADD CONSTRAINT `fk_ordens_servico_venda_independente` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`),
  ADD CONSTRAINT `ordens_servico_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`);

--
-- Restrições para tabelas `os_arquivos`
--
ALTER TABLE `os_arquivos`
  ADD CONSTRAINT `os_arquivos_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_arquivos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `os_checkup_qualidade`
--
ALTER TABLE `os_checkup_qualidade`
  ADD CONSTRAINT `os_checkup_qualidade_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_checkup_qualidade_ibfk_2` FOREIGN KEY (`venda_item_id`) REFERENCES `vendas_itens` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_checkup_qualidade_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `os_etapas_producao`
--
ALTER TABLE `os_etapas_producao`
  ADD CONSTRAINT `os_etapas_producao_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_etapas_producao_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `os_historico_status`
--
ALTER TABLE `os_historico_status`
  ADD CONSTRAINT `os_historico_status_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_historico_status_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `os_itens`
--
ALTER TABLE `os_itens`
  ADD CONSTRAINT `os_itens_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `os_observacoes`
--
ALTER TABLE `os_observacoes`
  ADD CONSTRAINT `os_observacoes_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_observacoes_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `os_projetos`
--
ALTER TABLE `os_projetos`
  ADD CONSTRAINT `os_projetos_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `os_projetos_ibfk_2` FOREIGN KEY (`usuario_responsavel_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `os_projeto_componentes`
--
ALTER TABLE `os_projeto_componentes`
  ADD CONSTRAINT `os_projeto_componentes_ibfk_1` FOREIGN KEY (`projeto_id`) REFERENCES `os_projetos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `pagamentos`
--
ALTER TABLE `pagamentos`
  ADD CONSTRAINT `pagamentos_ibfk_1` FOREIGN KEY (`conta_receber_id`) REFERENCES `contas_receber` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `pagamentos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `pessoas_atributos`
--
ALTER TABLE `pessoas_atributos`
  ADD CONSTRAINT `pessoas_atributos_ibfk_1` FOREIGN KEY (`pessoa_id`) REFERENCES `pessoas` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `plano_contas`
--
ALTER TABLE `plano_contas`
  ADD CONSTRAINT `plano_contas_ibfk_1` FOREIGN KEY (`pai_id`) REFERENCES `plano_contas` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `processos_produtivos`
--
ALTER TABLE `processos_produtivos`
  ADD CONSTRAINT `processos_produtivos_ibfk_1` FOREIGN KEY (`os_id`) REFERENCES `ordens_servico` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `sessoes`
--
ALTER TABLE `sessoes`
  ADD CONSTRAINT `sessoes_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `setores_estoque`
--
ALTER TABLE `setores_estoque`
  ADD CONSTRAINT `setores_estoque_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `setores_estoque_ibfk_2` FOREIGN KEY (`parent_id`) REFERENCES `setores_estoque` (`id`) ON DELETE SET NULL;

--
-- Restrições para tabelas `tempo_producao`
--
ALTER TABLE `tempo_producao`
  ADD CONSTRAINT `tempo_producao_ibfk_1` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios_2fa`
--
ALTER TABLE `usuarios_2fa`
  ADD CONSTRAINT `usuarios_2fa_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios_expedientes`
--
ALTER TABLE `usuarios_expedientes`
  ADD CONSTRAINT `fk_expediente_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios_expediente_logs`
--
ALTER TABLE `usuarios_expediente_logs`
  ADD CONSTRAINT `fk_expediente_log_expediente` FOREIGN KEY (`expediente_id`) REFERENCES `usuarios_expedientes` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_expediente_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `usuarios_grupos`
--
ALTER TABLE `usuarios_grupos`
  ADD CONSTRAINT `usuarios_grupos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuarios_grupos_ibfk_2` FOREIGN KEY (`grupo_id`) REFERENCES `grupos_usuarios` (`id`) ON DELETE CASCADE;

--
-- Restrições para tabelas `vendas`
--
ALTER TABLE `vendas`
  ADD CONSTRAINT `vendas_ibfk_1` FOREIGN KEY (`orcamento_id`) REFERENCES `orcamentos` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `vendas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`),
  ADD CONSTRAINT `vendas_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`);

--
-- Restrições para tabelas `vendas_itens`
--
ALTER TABLE `vendas_itens`
  ADD CONSTRAINT `vendas_itens_ibfk_1` FOREIGN KEY (`venda_id`) REFERENCES `vendas` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `vendas_itens_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`) ON DELETE SET NULL;
--
-- Banco de dados: `phpmyadmin`
--
CREATE DATABASE IF NOT EXISTS `phpmyadmin` DEFAULT CHARACTER SET utf8 COLLATE utf8_bin;
USE `phpmyadmin`;

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__bookmark`
--

CREATE TABLE `pma__bookmark` (
  `id` int(10) UNSIGNED NOT NULL,
  `dbase` varchar(255) NOT NULL DEFAULT '',
  `user` varchar(255) NOT NULL DEFAULT '',
  `label` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `query` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Bookmarks';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__central_columns`
--

CREATE TABLE `pma__central_columns` (
  `db_name` varchar(64) NOT NULL,
  `col_name` varchar(64) NOT NULL,
  `col_type` varchar(64) NOT NULL,
  `col_length` text DEFAULT NULL,
  `col_collation` varchar(64) NOT NULL,
  `col_isNull` tinyint(1) NOT NULL,
  `col_extra` varchar(255) DEFAULT '',
  `col_default` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Central list of columns';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__column_info`
--

CREATE TABLE `pma__column_info` (
  `id` int(5) UNSIGNED NOT NULL,
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `column_name` varchar(64) NOT NULL DEFAULT '',
  `comment` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `mimetype` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT '',
  `transformation` varchar(255) NOT NULL DEFAULT '',
  `transformation_options` varchar(255) NOT NULL DEFAULT '',
  `input_transformation` varchar(255) NOT NULL DEFAULT '',
  `input_transformation_options` varchar(255) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Column information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__designer_settings`
--

CREATE TABLE `pma__designer_settings` (
  `username` varchar(64) NOT NULL,
  `settings_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Settings related to Designer';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__export_templates`
--

CREATE TABLE `pma__export_templates` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL,
  `export_type` varchar(10) NOT NULL,
  `template_name` varchar(64) NOT NULL,
  `template_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved export templates';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__favorite`
--

CREATE TABLE `pma__favorite` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Favorite tables';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__history`
--

CREATE TABLE `pma__history` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db` varchar(64) NOT NULL DEFAULT '',
  `table` varchar(64) NOT NULL DEFAULT '',
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp(),
  `sqlquery` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='SQL history for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__navigationhiding`
--

CREATE TABLE `pma__navigationhiding` (
  `username` varchar(64) NOT NULL,
  `item_name` varchar(64) NOT NULL,
  `item_type` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Hidden items of navigation tree';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__pdf_pages`
--

CREATE TABLE `pma__pdf_pages` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `page_nr` int(10) UNSIGNED NOT NULL,
  `page_descr` varchar(50) CHARACTER SET utf8 COLLATE utf8_general_ci NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='PDF relation pages for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__recent`
--

CREATE TABLE `pma__recent` (
  `username` varchar(64) NOT NULL,
  `tables` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Recently accessed tables';

--
-- Despejando dados para a tabela `pma__recent`
--

INSERT INTO `pma__recent` (`username`, `tables`) VALUES
('root', '[{\"db\":\"sistema_os\",\"table\":\"produtos\"}]');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__relation`
--

CREATE TABLE `pma__relation` (
  `master_db` varchar(64) NOT NULL DEFAULT '',
  `master_table` varchar(64) NOT NULL DEFAULT '',
  `master_field` varchar(64) NOT NULL DEFAULT '',
  `foreign_db` varchar(64) NOT NULL DEFAULT '',
  `foreign_table` varchar(64) NOT NULL DEFAULT '',
  `foreign_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Relation table';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__savedsearches`
--

CREATE TABLE `pma__savedsearches` (
  `id` int(5) UNSIGNED NOT NULL,
  `username` varchar(64) NOT NULL DEFAULT '',
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `search_name` varchar(64) NOT NULL DEFAULT '',
  `search_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Saved searches';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_coords`
--

CREATE TABLE `pma__table_coords` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `pdf_page_number` int(11) NOT NULL DEFAULT 0,
  `x` float UNSIGNED NOT NULL DEFAULT 0,
  `y` float UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table coordinates for phpMyAdmin PDF output';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_info`
--

CREATE TABLE `pma__table_info` (
  `db_name` varchar(64) NOT NULL DEFAULT '',
  `table_name` varchar(64) NOT NULL DEFAULT '',
  `display_field` varchar(64) NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Table information for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__table_uiprefs`
--

CREATE TABLE `pma__table_uiprefs` (
  `username` varchar(64) NOT NULL,
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `prefs` text NOT NULL,
  `last_update` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Tables'' UI preferences';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__tracking`
--

CREATE TABLE `pma__tracking` (
  `db_name` varchar(64) NOT NULL,
  `table_name` varchar(64) NOT NULL,
  `version` int(10) UNSIGNED NOT NULL,
  `date_created` datetime NOT NULL,
  `date_updated` datetime NOT NULL,
  `schema_snapshot` text NOT NULL,
  `schema_sql` text DEFAULT NULL,
  `data_sql` longtext DEFAULT NULL,
  `tracking` set('UPDATE','REPLACE','INSERT','DELETE','TRUNCATE','CREATE DATABASE','ALTER DATABASE','DROP DATABASE','CREATE TABLE','ALTER TABLE','RENAME TABLE','DROP TABLE','CREATE INDEX','DROP INDEX','CREATE VIEW','ALTER VIEW','DROP VIEW') DEFAULT NULL,
  `tracking_active` int(1) UNSIGNED NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Database changes tracking for phpMyAdmin';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__userconfig`
--

CREATE TABLE `pma__userconfig` (
  `username` varchar(64) NOT NULL,
  `timevalue` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `config_data` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User preferences storage for phpMyAdmin';

--
-- Despejando dados para a tabela `pma__userconfig`
--

INSERT INTO `pma__userconfig` (`username`, `timevalue`, `config_data`) VALUES
('root', '2026-03-18 10:35:28', '{\"Console\\/Mode\":\"collapse\",\"lang\":\"pt\"}');

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__usergroups`
--

CREATE TABLE `pma__usergroups` (
  `usergroup` varchar(64) NOT NULL,
  `tab` varchar(64) NOT NULL,
  `allowed` enum('Y','N') NOT NULL DEFAULT 'N'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='User groups with configured menu items';

-- --------------------------------------------------------

--
-- Estrutura para tabela `pma__users`
--

CREATE TABLE `pma__users` (
  `username` varchar(64) NOT NULL,
  `usergroup` varchar(64) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin COMMENT='Users and their assignments to user groups';

--
-- Índices para tabelas despejadas
--

--
-- Índices de tabela `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  ADD PRIMARY KEY (`id`);

--
-- Índices de tabela `pma__central_columns`
--
ALTER TABLE `pma__central_columns`
  ADD PRIMARY KEY (`db_name`,`col_name`);

--
-- Índices de tabela `pma__column_info`
--
ALTER TABLE `pma__column_info`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `db_name` (`db_name`,`table_name`,`column_name`);

--
-- Índices de tabela `pma__designer_settings`
--
ALTER TABLE `pma__designer_settings`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_user_type_template` (`username`,`export_type`,`template_name`);

--
-- Índices de tabela `pma__favorite`
--
ALTER TABLE `pma__favorite`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__history`
--
ALTER TABLE `pma__history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `username` (`username`,`db`,`table`,`timevalue`);

--
-- Índices de tabela `pma__navigationhiding`
--
ALTER TABLE `pma__navigationhiding`
  ADD PRIMARY KEY (`username`,`item_name`,`item_type`,`db_name`,`table_name`);

--
-- Índices de tabela `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  ADD PRIMARY KEY (`page_nr`),
  ADD KEY `db_name` (`db_name`);

--
-- Índices de tabela `pma__recent`
--
ALTER TABLE `pma__recent`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__relation`
--
ALTER TABLE `pma__relation`
  ADD PRIMARY KEY (`master_db`,`master_table`,`master_field`),
  ADD KEY `foreign_field` (`foreign_db`,`foreign_table`);

--
-- Índices de tabela `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `u_savedsearches_username_dbname` (`username`,`db_name`,`search_name`);

--
-- Índices de tabela `pma__table_coords`
--
ALTER TABLE `pma__table_coords`
  ADD PRIMARY KEY (`db_name`,`table_name`,`pdf_page_number`);

--
-- Índices de tabela `pma__table_info`
--
ALTER TABLE `pma__table_info`
  ADD PRIMARY KEY (`db_name`,`table_name`);

--
-- Índices de tabela `pma__table_uiprefs`
--
ALTER TABLE `pma__table_uiprefs`
  ADD PRIMARY KEY (`username`,`db_name`,`table_name`);

--
-- Índices de tabela `pma__tracking`
--
ALTER TABLE `pma__tracking`
  ADD PRIMARY KEY (`db_name`,`table_name`,`version`);

--
-- Índices de tabela `pma__userconfig`
--
ALTER TABLE `pma__userconfig`
  ADD PRIMARY KEY (`username`);

--
-- Índices de tabela `pma__usergroups`
--
ALTER TABLE `pma__usergroups`
  ADD PRIMARY KEY (`usergroup`,`tab`,`allowed`);

--
-- Índices de tabela `pma__users`
--
ALTER TABLE `pma__users`
  ADD PRIMARY KEY (`username`,`usergroup`);

--
-- AUTO_INCREMENT para tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `pma__bookmark`
--
ALTER TABLE `pma__bookmark`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__column_info`
--
ALTER TABLE `pma__column_info`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__export_templates`
--
ALTER TABLE `pma__export_templates`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__history`
--
ALTER TABLE `pma__history`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__pdf_pages`
--
ALTER TABLE `pma__pdf_pages`
  MODIFY `page_nr` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de tabela `pma__savedsearches`
--
ALTER TABLE `pma__savedsearches`
  MODIFY `id` int(5) UNSIGNED NOT NULL AUTO_INCREMENT;
--
-- Banco de dados: `test`
--
CREATE DATABASE IF NOT EXISTS `test` DEFAULT CHARACTER SET latin1 COLLATE latin1_swedish_ci;
USE `test`;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
