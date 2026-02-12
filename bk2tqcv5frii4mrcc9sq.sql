-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: bk2tqcv5frii4mrcc9sq-mysql.services.clever-cloud.com:21125
-- Generation Time: Feb 12, 2026 at 02:14 PM
-- Server version: 8.4.7-7
-- PHP Version: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bk2tqcv5frii4mrcc9sq`
--

-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

CREATE TABLE `todos` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `due_date` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `due_time` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sort_timestamp` bigint NOT NULL,
  `type` enum('task','event') COLLATE utf8mb4_general_ci NOT NULL,
  `priority` enum('low','normal','high') COLLATE utf8mb4_general_ci NOT NULL,
  `subtasks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted_at` bigint DEFAULT NULL
) ;

--
-- Dumping data for table `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `text`, `completed`, `created_at`, `due_date`, `due_time`, `location`, `sort_timestamp`, `type`, `priority`, `subtasks`, `deleted_at`) VALUES
(12, 2, 'De luat diplomele', 0, 1770144936770, '06 februarie 2026', '11:00', NULL, 1770336000000, 'task', 'normal', NULL, NULL),
(15, 2, 'De făcut cont la BCR', 1, 1770145174261, '05 februarie 2026', NULL, NULL, 1770249600000, 'task', 'normal', NULL, NULL),
(23, 2, 'Programare la dentist', 1, 1770302589412, '06 februarie 2026', '13:00', 'Emil Racoviță 2', 1770336000000, 'event', 'high', NULL, 1770901032531),
(25, 2, 'De plătit impozite prin ghișeul.ro', 0, 1770303999074, '06 februarie 2026', NULL, NULL, 1770336000000, 'task', 'normal', '[\"Locuință la sălcuța\",\"Teren la Petrăchioaia\"]', NULL),
(28, 2, 'Întâlnire cu Cristina', 1, 1770312021789, '05 februarie 2026', '19:30', 'Vălsănești, 68', 1770249600000, 'task', 'normal', '[\"Luat hainele curate\",\"De vorbit despre firmă\"]', NULL),
(33, 4, 'Alimente', 0, 1770313340921, '05 februarie 2026', NULL, NULL, 1770313340921, 'task', 'normal', NULL, NULL),
(35, 2, 'De virat bani pt benzină în mașina lui Claudiu, prin BCR.', 0, 1770315241204, '06 februarie 2026', NULL, NULL, 1770336000000, 'task', 'normal', NULL, NULL),
(38, 2, 'De luat ochelarii din mașină', 1, 1770419178552, '07 februarie 2026', '06:00', NULL, 1770422400000, 'task', 'normal', NULL, NULL),
(40, 2, 'Banner sus pentru Helloromania.UK', 0, 1770471345953, '08 februarie 2026', '13:00', NULL, 1770508800000, 'event', 'normal', NULL, 1770902714827),
(42, 2, 'Trimis antigravity lui Răzvan', 1, 1770480323838, '07 februarie 2026', NULL, NULL, 1770480323838, 'task', 'high', NULL, NULL),
(45, 2, 'De luat copii de acolo', 1, 1770480437917, '07 februarie 2026', '18:00', 'Shopping Center', 1770422400000, 'event', 'high', NULL, NULL),
(46, 2, 'Verificat plugin-ul jetpack pentru targetzerotraining.co.uk', 1, 1770480572422, '07 februarie 2026', '16:08', NULL, 1770422400000, 'event', 'high', NULL, NULL),
(47, 2, 'Shopping', 0, 1770486588259, 'February 08, 2026', '11:00', NULL, 1770508800000, 'event', 'normal', '[\"Cumpără suport\",\"De cumpărat pantalon și bluză\",\"De cumpărat bandă dublu adezivă\"]', NULL),
(51, 2, 'Cursuri cu Ștefan Piolet', 1, 1770488640158, '08 februarie 2026', '09:00', NULL, 1770508800000, 'event', 'normal', NULL, NULL),
(53, 3, 'De plecat la muncă', 0, 1770496239086, '08 februarie 2026', '07:00', 'University Hospital South End On Sea', 1770508800000, 'event', 'normal', NULL, NULL),
(54, 3, 'Să fac mâncare', 0, 1770496343400, '12 februarie 2026', NULL, NULL, 1770854400000, 'task', 'normal', NULL, NULL),
(55, 2, 'De făcut biroul pentru sufragerie', 1, 1770549018488, '08 februarie 2026', '14:00', NULL, 1770508800000, 'event', 'normal', NULL, NULL),
(56, 2, 'Shopping Amazon', 1, 1770555913356, '10 februarie 2026', '10:00', NULL, 1770681600000, 'event', 'normal', NULL, NULL),
(58, 2, 'De luat copiii', 1, 1770659055095, 'February 09, 2026', '20:30', 'Garons', 1770595200000, 'event', 'normal', NULL, NULL),
(60, 2, 'South and Tech meetup', 0, 1770714023936, '19 februarie 2026', '19:00', 'South And Sea', 1771459200000, 'event', 'normal', NULL, NULL),
(62, 4, 'Întâlnirea cu Nea Petrică', 0, 1770821247929, '11 februarie 2026', '15:00', NULL, 1770768000000, 'event', 'normal', '[\"14:00 - întâlnire cu doamna Diana\",\"16:00 - întâlnire cu Nea Petrică\",\"17:00 - întâlnire cu Nea Vasilică\"]', NULL),
(63, 2, 'Intalnire cu Alex', 0, 1770897368170, '19 februarie 2026', '18:00', 'Londra', 1771459200000, 'event', 'normal', NULL, NULL),
(65, 2, 'De luat copiii de la spital', 0, 1770903279128, '12 februarie 2026', '17:00', 'South Kent University Hospital', 1770854400000, 'event', 'normal', NULL, NULL),
(66, 2, 'Întâlnire', 0, 1770903314479, '12 februarie 2026', '16:00', 'Southend Hospital', 1770854400000, 'event', 'normal', NULL, 1770903371015);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `image` varchar(512) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `provider` varchar(32) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'credentials',
  `provider_account_id` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `image`, `password_hash`, `provider`, `provider_account_id`, `created_at`, `updated_at`) VALUES
(2, 'dani.iancu@yahoo.com', 'Daniel Iancu', NULL, '$2b$10$Qhu9Q.2iiTzTQEGlJPxCTOyYRbRR7KFEIqVNSifewb7CgOXFKysru', 'credentials', NULL, '2026-02-03 17:34:37', '2026-02-03 17:34:37'),
(3, 'ioanaiancu15@gmail.com', 'Ioana', NULL, '$2b$10$xFsfgqoy1ELGzx1GNFNEEeUkwmdOFXWm4UUB1sOBjvYLiFx9THvja', 'credentials', NULL, '2026-02-05 15:40:44', '2026-02-05 15:40:44'),
(4, 'claudiuiancu2008@gmail.com', 'Claudiu', NULL, '$2b$10$KVi5Hzw6hZeDerAA0SUWTOuqtVzBgWMmDjATp2AuR44nM.Rhzckz6', 'credentials', NULL, '2026-02-05 17:18:50', '2026-02-05 17:18:50');

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `user_id` bigint NOT NULL,
  `active_tab` enum('task','event') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'task',
  `language` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'en',
  `active_date_filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `filter_task` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'all',
  `filter_event` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'all',
  `calendar_month` varchar(7) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_language` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_active_tab` enum('task','event') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_show_subtasks` tinyint(1) NOT NULL DEFAULT '0'
) ;

--
-- Dumping data for table `user_settings`
--

INSERT INTO `user_settings` (`user_id`, `active_tab`, `language`, `active_date_filters`, `filter_task`, `filter_event`, `calendar_month`, `default_language`, `default_active_tab`, `default_show_subtasks`) VALUES
(2, 'event', 'ro', '[\"2026-1-12\",\"2026-1-13\",\"2026-1-14\",\"2026-1-15\",\"2026-1-16\",\"2026-1-17\",\"2026-1-18\",\"2026-1-19\"]', 'all', 'all', '2026-02', 'ro', 'event', 1),
(3, 'task', 'ro', '[]', 'all', 'all', '2026-02', NULL, NULL, 0),
(4, 'event', 'ro', '[]', 'all', 'all', '2026-02', 'ro', 'task', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_todos_user` (`user_id`),
  ADD KEY `idx_todos_user_deleted` (`user_id`,`deleted_at`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `provider_account_unique` (`provider`,`provider_account_id`);

--
-- Indexes for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD PRIMARY KEY (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `todos`
--
ALTER TABLE `todos`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `fk_todos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
