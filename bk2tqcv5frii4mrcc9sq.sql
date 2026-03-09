-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: bk2tqcv5frii4mrcc9sq-mysql.services.clever-cloud.com:21125
-- Generation Time: Mar 09, 2026 at 09:15 AM
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
-- Table structure for table `labels`
--

CREATE TABLE `labels` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#2563EB',
  `created_at` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `labels`
--

INSERT INTO `labels` (`id`, `user_id`, `name`, `color`, `created_at`) VALUES
(8, 2, 'Work', '#DC2626', 1770930438222),
(14, 2, 'Fun', '#7C3AED', 1770982120713),
(15, 2, 'Family', '#D97706', 1771067365428),
(18, 2, 'Sănătate', '#16A34A', 1772991638799);

-- --------------------------------------------------------

--
-- Table structure for table `reminder_jobs`
--

CREATE TABLE `reminder_jobs` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `todo_id` bigint NOT NULL,
  `channel` enum('email','sms','push') NOT NULL,
  `scheduled_for` bigint NOT NULL,
  `status` enum('scheduled','sent','failed','canceled') NOT NULL DEFAULT 'scheduled',
  `provider_job_id` varchar(255) DEFAULT NULL,
  `error_message` varchar(512) DEFAULT NULL,
  `attempts` int NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `sent_at` bigint DEFAULT NULL,
  `canceled_at` bigint DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `reminder_jobs`
--

INSERT INTO `reminder_jobs` (`id`, `user_id`, `todo_id`, `channel`, `scheduled_for`, `status`, `provider_job_id`, `error_message`, `attempts`, `created_at`, `sent_at`, `canceled_at`) VALUES
(25, 2, 90, 'email', 1771005000000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNCtiJEh1uTy6ZuzU98xnHmPhTPPsSvCYw58hHKGudke', NULL, 0, 1770988417216, NULL, 1770988433922),
(26, 2, 90, 'email', 1771005000000, 'canceled', 'msg_7YoJxFpwkEy5zBp2S6u63kjJK6BH8dYDPeMM5VQo3S1LNJf7mPgXN', NULL, 0, 1770988438255, NULL, 1770988539161),
(27, 2, 90, 'email', 1771003800000, 'canceled', 'msg_7YoJxFpwkEy5zBp2W1ee88Tn58oihA7eaFNMfmi8koCipu7WbeJj8', NULL, 0, 1770988539205, NULL, 1770989356487),
(28, 2, 90, 'email', 1771003800000, 'canceled', 'msg_7YoJxFpwkEy6sUx67besCpsxnXBupRtUmwf5FLZmC1qJRbvXMKJ9J', NULL, 0, 1770989356523, NULL, 1770990921315),
(32, 2, 90, 'email', 1771005000000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNC1RACo4KFcWS1Sgyj7JpiEBNZhFfmSfiCK5YVuYTAn', NULL, 0, 1770990967763, NULL, 1770991090014),
(33, 2, 90, 'email', 1771003800000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNCtiJE9XrCjSQiedBVvpyk8Y6joGh3rKgRW9niTE38F', NULL, 0, 1770991287644, NULL, 1770992474695),
(34, 2, 90, 'email', 1771002000000, 'canceled', 'msg_7YoJxFpwkEy6sUx4uzNh7MVDkRLkwUtpnRANwopE5DoyqeEMWX9aF', NULL, 0, 1770992494847, NULL, 1770997136809),
(35, 2, 84, 'email', 1771051800000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNC1RADwowqthsCM8jzXNYbVLDA3LoC5FwAGYFb8UcCJ', NULL, 0, 1770992653402, NULL, 1770993530554),
(36, 2, 84, 'email', 1771051800000, 'sent', 'msg_7YoJxFpwkEy5zBp3B5GCKBQVxyT4zcLgpf6Y5EK8mNMoCyFcifbCf', NULL, 1, 1770993592354, 1771051802142, NULL),
(37, 2, 90, 'email', 1771003800000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB882APriuzg4JHcznWzeWBAaPBQwANfVe6X4s5Vb52', NULL, 1, 1770997151375, 1771003802368, NULL),
(38, 2, 102, 'email', 1771074600000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB8829kh3A9ZLASPe1HQYqH3r58BzgD2VgyVmDbgTh3', NULL, 1, 1771067289310, 1771074600944, NULL),
(41, 2, 103, 'email', 1771084200000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNC1RABg3Q6APaeWA7rYvuQDyZJ3ntWcQSoDaxuTB5c2', NULL, 0, 1771072572354, NULL, 1771072583301),
(43, 2, 103, 'email', 1771083000000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNCtiJFF4CDxSswz25qzwvZ9PmzupcxqJFWuZY8BwsPS', NULL, 0, 1771072657699, NULL, 1771079752307),
(47, 2, 97, 'email', 1771145400000, 'canceled', 'msg_7YoJxFpwkEy6sUx5WJz21Qk1pZVVBLtwfLiqG1jMZ8MKN6UnU4G3s', NULL, 0, 1771072935074, NULL, 1771073172802),
(56, 2, 103, 'email', 1771083000000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB8829qJc8mtBbS9VQ3rikBVjy8VYJu7jQUYdDVe75J', NULL, 1, 1771081611533, 1771083001046, NULL),
(63, 2, 116, 'email', 1771662600000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNCtiJFKWXA2VheasvuYD1W2pSckeUnMZKvp7Fr1XuUM', NULL, 1, 1771608663513, 1771662602510, NULL),
(64, 2, 118, 'email', 1771661700000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNC1RACJGtezq1xL7QxmUa37EDj69gDn1TJ2oRYMNjRq', NULL, 1, 1771608837913, 1771661702356, NULL),
(65, 2, 134, 'email', 1772442000000, 'canceled', 'msg_7YoJxFpwkEy6sUx673bUkZjnUFKLVNUYLkyFNdvJmR3zKRoeg9rFS', NULL, 0, 1771930556483, NULL, 1772440199426),
(66, 2, 132, 'email', 1771948800000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB882AvGZNPR3VQmiCtA8TPswnjysKUUcD7gDCNnD56', NULL, 1, 1771930628628, 1771948801828, NULL),
(72, 2, 97, 'email', 1772473800000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB882BWkAx6Ne4emEp4r53C8Lc4gGhcxBnjmYSSRr4D', NULL, 1, 1772466515483, 1772473801214, NULL),
(75, 2, 156, 'email', 1772559900000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNC1RACrgHVWXK8BPmzuLpLcJdEmiM2Rz7e8BwkwfVxc', NULL, 1, 1772552911765, 1772559901194, NULL),
(77, 2, 154, 'email', 1772873400000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNC1RACup7aQKRkn8xmDpPQ5B8XUxkRFTiVZxL2suQ9d', NULL, 1, 1772651749871, 1772873405042, NULL),
(78, 2, 155, 'email', 1772870400000, 'canceled', 'msg_26hZCxZCuWyyTWPmSVBrNCtiJFKQ2XDrsWHquZDgRsoeWtnMKrqEadRFkpqSnNg', NULL, 0, 1772739409729, NULL, 1772739475271),
(79, 2, 155, 'email', 1772874000000, 'sent', 'msg_26hZCxZCuWyyTWPmSVBrNB8829sAv3RAMTDwGQHmScVZWBtejWS5wRcFTNgTu9b', NULL, 1, 1772739493965, 1772874002454, NULL),
(80, 2, 162, 'email', 1772812800000, 'sent', 'msg_7YoJxFpwkEy5zBp3csqPWchzcDhPrcHfNPNLodoFmmYvY9CxcP6N3', NULL, 1, 1772805035711, 1772812803313, NULL),
(86, 2, 153, 'email', 1772889300000, 'sent', 'msg_7YoJxFpwkEy5zBp3BbrU1tACkxY2ZsT1AcWNUHuYyiZNSX47mtASW', NULL, 1, 1772887629855, 1772889301993, NULL),
(88, 2, 163, 'email', 1772992200000, 'canceled', 'msg_7YoJxFpwkEy5zBp36BzNCgxbrzLpn74AQ4qHJNHw3bCTFPSVjcYEE', NULL, 0, 1772991423033, NULL, 1772991740789);

-- --------------------------------------------------------

--
-- Table structure for table `todos`
--

CREATE TABLE `todos` (
  `id` bigint NOT NULL,
  `user_id` bigint NOT NULL,
  `local_id` bigint NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` bigint NOT NULL,
  `due_date` varchar(32) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `due_time` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `due_end_time` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `location` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `sort_timestamp` bigint NOT NULL,
  `type` enum('task','event') COLLATE utf8mb4_general_ci NOT NULL,
  `priority` enum('low','normal','high') COLLATE utf8mb4_general_ci NOT NULL,
  `subtasks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `deleted_at` bigint DEFAULT NULL,
  `label_id` bigint DEFAULT NULL,
  `reminder_minutes_before` int DEFAULT NULL,
  `reminder_channel` enum('email','sms','push') COLLATE utf8mb4_general_ci DEFAULT NULL
) ;

--
-- Dumping data for table `todos`
--

INSERT INTO `todos` (`id`, `user_id`, `local_id`, `title`, `text`, `completed`, `created_at`, `due_date`, `due_time`, `due_end_time`, `location`, `sort_timestamp`, `type`, `priority`, `subtasks`, `deleted_at`, `label_id`, `reminder_minutes_before`, `reminder_channel`) VALUES
(25, 2, 1, 'De plătit impozite prin ghișeul.ro', 'De plătit impozite prin ghișeul.ro', 0, 1770303999074, NULL, NULL, NULL, NULL, 1772668800000, 'task', 'high', NULL, NULL, NULL, NULL, NULL),
(33, 4, 1, 'Alimente', 'Alimente', 0, 1770313340921, NULL, NULL, NULL, NULL, 1770313340921, 'task', 'normal', NULL, 1771671115682, NULL, NULL, NULL),
(35, 2, 2, 'De virat bani pt benzină în mașina lui Claudiu, prin BCR.', '', 0, 1770315241204, NULL, NULL, NULL, NULL, 1770303999074, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(53, 3, 1, NULL, 'De plecat la muncă', 0, 1770496239086, '08 februarie 2026', '07:00', NULL, 'University Hospital South End On Sea', 1770508800000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(54, 3, 2, 'Să fac mâncare', 'Să fac mâncare', 0, 1770496343400, NULL, NULL, NULL, NULL, 1770496343400, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(56, 2, 3, NULL, 'Shopping Amazon', 1, 1770555913356, '10 februarie 2026', '10:00', NULL, NULL, 1770681600000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(58, 2, 4, NULL, 'De luat copiii', 1, 1770659055095, 'February 09, 2026', '13:15', NULL, 'Garons', 1770595200000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(60, 2, 5, NULL, 'South and Tech meetup', 0, 1770714023936, 'February 19, 2026', '19:00', NULL, 'Southend on Sea', 1771459200000, 'event', 'normal', NULL, 1772381872508, NULL, NULL, NULL),
(62, 4, 2, NULL, 'Întâlnirea cu Nea Petrică', 0, 1770821247929, '11 februarie 2026', '15:00', NULL, NULL, 1770768000000, 'event', 'normal', '[\"14:00 - întâlnire cu doamna Diana\",\"16:00 - întâlnire cu Nea Petrică\",\"17:00 - întâlnire cu Nea Vasilică\"]', 1771671248327, NULL, NULL, NULL),
(63, 2, 6, NULL, 'Intalnire cu Alex', 0, 1770897368170, '19 februarie 2026', '18:00', NULL, 'Londra', 1771459200000, 'event', 'high', NULL, 1772368329001, 14, NULL, NULL),
(65, 2, 7, NULL, 'De luat copiii de la spital', 1, 1770903279128, '12 februarie 2026', '17:00', NULL, 'South Kent University Hospital', 1770854400000, 'event', 'high', '[\"De ajuns acolo\",\"De mers acasa\"]', NULL, NULL, NULL, NULL),
(69, 2, 9, NULL, 'Meeting online pentru printare 3d', 1, 1770910355756, '12 februarie 2026', '18:00', NULL, NULL, 1770854400000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(71, 2, 10, 'De luat Oliver', 'De luat Oliver de la Glenn acasă', 1, 1770918352321, 'February 13, 2026', '07:30', NULL, NULL, 1770940800000, 'event', 'high', NULL, NULL, 8, NULL, NULL),
(84, 2, 23, NULL, 'Întâlnire cu Ștefan Piolet', 1, 1770970608387, '14 februarie 2026', '07:00', NULL, NULL, 1771027200000, 'event', 'normal', '[\"De rezolvat functiile javascript\",\"De dat test\"]', NULL, NULL, NULL, NULL),
(90, 2, 29, NULL, 'Plimbare pana la mare', 1, 1770975666819, 'February 13, 2026', '18:00', NULL, NULL, 1770940800000, 'event', 'normal', NULL, NULL, 14, NULL, NULL),
(97, 2, 33, NULL, 'Rezolvare problemă imprimantă 3D', 0, 1770993400640, '09 martie 2026', '18:00', NULL, NULL, 1773014400000, 'event', 'high', NULL, NULL, 8, NULL, NULL),
(98, 2, 34, NULL, 'Verificare electricitate acasă', 1, 1770998202712, '13 februarie 2026', '17:30', NULL, NULL, 1770940800000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(102, 2, 38, NULL, 'Înot cu Harry', 1, 1771067117731, '14 februarie 2026', '13:40', NULL, 'Garon Swimming Pool', 1771027200000, 'event', 'normal', NULL, NULL, 15, NULL, NULL),
(103, 2, 39, NULL, 'Tuns pentru Patrick la Tony and Guy', 1, 1771067176175, 'February 14, 2026', '16:00', NULL, 'Royal Mall', 1771027200000, 'event', 'normal', NULL, NULL, 15, NULL, NULL),
(105, 2, 41, NULL, 'Cod pentru Velvet Drivers', 1, 1771079547666, '02 martie 2026', '17:00', NULL, NULL, 1772409600000, 'event', 'normal', NULL, NULL, 8, NULL, NULL),
(108, 2, 44, NULL, 'Ieșit afară cu drona', 1, 1771082274624, '22 februarie 2026', '12:00', NULL, NULL, 1771718400000, 'event', 'normal', NULL, 1772466444307, NULL, NULL, NULL),
(109, 2, 45, 'AWS Services', 'AM instalat un serviciu nou la AWS, pe contul reminders@voicetask.net.\nEste free pana pe 15 August 2026 (6 luni) in limita a 200 de dolari.\nEste pentru proiectul ai-code-master.vercel.app', 0, 1771152162109, NULL, NULL, NULL, NULL, 1770315241204, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(112, 2, 48, NULL, 'De cumpărat medicamente', 1, 1771170316261, '20 februarie 2026', NULL, NULL, 'Tesco', 1771545600000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(115, 2, 51, NULL, 'Service pentru Dacia', 1, 1771262036698, '25 februarie 2026', '08:00', NULL, NULL, 1771977600000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(116, 2, 52, NULL, 'Call online cu Ștefan Piolet', 1, 1771608611282, 'February 21, 2026', '09:00', NULL, NULL, 1771632000000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(118, 2, 54, NULL, 'De dus Maria la înot', 1, 1771608822623, 'February 21, 2026', '08:45', NULL, NULL, 1771632000000, 'event', 'normal', NULL, 1772466453211, NULL, NULL, NULL),
(119, 2, 55, 'De verificat zboruri in Romania', '', 0, 1771611979020, NULL, NULL, NULL, NULL, 1771152162109, 'task', 'high', NULL, NULL, NULL, NULL, NULL),
(120, 2, 56, 'Am instalat AWS pe contul de email de munca gratis 6 luni, pt baze de date serverless.', 'Este pentru proiectul ai-code-master.vercel.app', 0, 1771612029508, NULL, NULL, NULL, NULL, 1771612029508, 'task', 'high', NULL, 1772307941376, NULL, NULL, NULL),
(121, 2, 57, 'De rezolvat pașaportul lui Patrick', '', 0, 1771612181251, NULL, NULL, NULL, NULL, 1771612181251, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(122, 2, 58, NULL, 'Întâlnire cu Alex. la stratfod', 1, 1771616781128, 'February 22, 2026', '11:00', NULL, NULL, 1771718400000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(123, 4, 3, 'Maioneză', 'maioneză', 0, 1771671125800, NULL, NULL, NULL, NULL, 1771671125800, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(124, 4, 4, 'Gel', 'salina un gel', 0, 1771671130928, NULL, NULL, NULL, NULL, 1771671130928, 'task', 'normal', NULL, 1771671151284, NULL, NULL, NULL),
(125, 4, 5, 'Oua', 'oua', 0, 1771671132772, NULL, NULL, NULL, NULL, 1771671132772, 'task', 'normal', NULL, 1771671147537, NULL, NULL, NULL),
(126, 4, 6, 'Ulei', 'ulei', 0, 1771671133358, NULL, NULL, NULL, NULL, 1771671133358, 'task', 'normal', NULL, 1771671145479, NULL, NULL, NULL),
(127, 4, 7, 'Cartofi', 'cartofi', 0, 1771671133897, NULL, NULL, NULL, NULL, 1771671133897, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(128, 4, 8, 'Alimente', 'Lista de alimente', 0, 1771671187282, NULL, NULL, NULL, NULL, 1771671187282, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(130, 2, 60, NULL, 'De anulat abonamentul Linkedin for free!!!!!!', 0, 1771779731264, '21 martie 2026', NULL, NULL, NULL, 1774051200000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(131, 2, 61, 'Am adaugat abonament Premium la Linkedin. De anulat.', 'este deja rezervat și la task uri', 0, 1771779779011, NULL, NULL, NULL, NULL, 1771779779011, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(132, 2, 62, NULL, 'Contactat Simona pentru semnătură electronică pentru schimbare Cod CAEN', 0, 1771833418160, '09 martie 2026', '19:35', NULL, NULL, 1773014400000, 'event', 'normal', NULL, 1772991136246, NULL, NULL, NULL),
(133, 2, 63, NULL, 'Telefon cu Ema.', 1, 1771928345975, '26 februarie 2026', '16:30', NULL, NULL, 1772064000000, 'event', 'normal', '[\"Vorbesc din masina\"]', NULL, NULL, NULL, NULL),
(134, 2, 64, NULL, 'Pașapoarte copii', 1, 1771930534552, '03 martie 2026', '09:00', NULL, 'London', 1772496000000, 'event', 'normal', '[]', NULL, 15, NULL, NULL),
(135, 2, 65, NULL, 'Întâlnire cu Leo', 0, 1771943427541, '25 februarie 2026', '17:00', NULL, 'Chockwell Park', 1771977600000, 'event', 'normal', NULL, 1772105462853, NULL, NULL, NULL),
(136, 2, 66, NULL, 'Curs cu Stefan Piolet', 1, 1772105150638, '01 martie 2026', '08:00', NULL, NULL, 1772323200000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(137, 2, 67, NULL, 'De luat medicamente de la Tesco.', 1, 1772118746835, '26 februarie 2026', '17:00', NULL, 'Tesco Southend', 1772064000000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(138, 2, 68, 'Aplicații în lucru', '- ride4kids\n- hacks chatGPT (prompt deocamdata)\n- cod functions pt Stefan (cursuri.net, aistudio deocamdata)\n- ceasuri Mihaela (Lovable)\n- fucking velvetul curului', 0, 1772307738066, NULL, NULL, NULL, NULL, 1772307738066, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(139, 2, 69, NULL, 'Întâlnire cu Mati din Franța', 1, 1772361541654, '01 martie 2026', '17:00', NULL, 'Southend On Sea', 1772323200000, 'event', 'high', '[\"De vorbit despre aplicatie\",\"De rezolvat cu statutul lui Razvan\",\"De stabilit întâlnirea viitoare\"]', NULL, 8, NULL, NULL),
(140, 2, 70, 'Nota noua', 'vreau ceva aici', 0, 1772378289010, NULL, NULL, NULL, NULL, 1772378289010, 'task', 'normal', '[\"Unu\",\"Doi\"]', 1772378555384, NULL, NULL, NULL),
(141, 2, 71, NULL, 'De luat concediu pentru marți, pentru pașapoarte', 1, 1772389781114, '02 martie 2026', '08:00', NULL, 'Chelmsford', 1772409600000, 'event', 'high', NULL, NULL, 8, NULL, NULL),
(142, 2, 72, 'Rezolvare aplicatie VoiceTask', '- calendar Luni-Duminica\n- ucoming tasks in calendar - cu ziua (lini, marti etc)\n- cand glisezi card, sa se vada dedesubt rosu si icon gunoi\n\n\n__________________________________________\n- ora inceput / ora sfarsit\n- să poți da stop oricând la ascultare, și pe desktop\n- cand vorbește înapoi, să se oprească din modul de ascultare\n- sa se poata muta cardurile de la notite sus/jos\n- sa nu mai scrie \"Limbi\" la limbi\n- cand alegi o zi din calendar \"rapid\" sa nu se mai reseteze selectia de calendar\n- la lista scurta de la calendar - pills cu Realizat/Depasit daca e cazul\n- la reminder schimbat \"inainte cu\", sunt 1440minute\n- la mobil, de inlocuit modalurile cu ecrane la edit si alarma\n- de adus tool de search', 0, 1772391155133, NULL, NULL, NULL, NULL, 1772928000000, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(143, 2, 73, 'Lista de servicii platite', '- Suno\n- Youtube premium\n- Clever DB\n- Meshy AI\n- Linkedin\n- AWS (gratis 6 luni - il folosesc la ai-master-code)\n- Romarg\n- Telefon Romania', 0, 1772391500080, NULL, NULL, NULL, NULL, 1772391155133, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(144, 2, 74, NULL, 'Concert cargo', 0, 1772393793297, '13 martie 2026', '19:00', NULL, 'Scala London', 1773360000000, 'event', 'normal', '[]', NULL, 14, NULL, NULL),
(145, 2, 75, NULL, 'JavaScript plus database pentru Ștefan', 0, 1772396819179, '05 martie 2026', '12:00', NULL, NULL, 1772668800000, 'event', 'normal', NULL, 1772697807224, 8, NULL, NULL),
(146, 2, 76, NULL, 'De făcut modificările indicate de Fayz', 1, 1772396888509, '02 martie 2026', '08:15', NULL, NULL, 1772409600000, 'event', 'low', NULL, NULL, NULL, NULL, NULL),
(147, 10, 1, NULL, 'Pian', 0, 1772405334735, '16 mars 2026', '18:00', NULL, 'Conservatoire Cachan', 1773615600000, 'event', 'normal', '[\"Audition piano salle rameau\"]', NULL, NULL, NULL, NULL),
(148, 10, 2, NULL, 'Cours de danse', 0, 1772405556075, 'March 02, 2026', NULL, NULL, NULL, 1772406000000, 'event', 'normal', NULL, 1772722804826, NULL, NULL, NULL),
(149, 2, 77, NULL, 'De plătit amenda', 0, 1772474053723, '05 martie 2026', NULL, NULL, 'Chelmsford', 1772668800000, 'event', 'high', '[{\"text\":\"Un subtask\",\"completed\":false},{\"text\":\"Doua subtaskuri\",\"completed\":false}]', 1772697836549, NULL, NULL, NULL),
(150, 2, 78, 'Întâlnire pentru velvet', 'Întâlnire pentru velvet', 1, 1772474498168, '02 martie 2026', '21:00', NULL, NULL, 1772409600000, 'event', 'normal', NULL, NULL, 8, NULL, NULL),
(151, 2, 79, 'Sa cumpar lapte si oua', 'sa cumpar lapte si oua', 0, 1772474517414, NULL, NULL, NULL, NULL, 1772474517414, 'task', 'normal', NULL, 1772486757217, NULL, NULL, NULL),
(152, 2, 80, NULL, 'Sedinta', 0, 1772474518345, '02 martie 2026', '19:00', NULL, NULL, 1772409600000, 'event', 'normal', NULL, 1772474548447, NULL, NULL, NULL),
(153, 2, 81, NULL, 'Adam la înot', 1, 1772547176318, '07 martie 2026', '13:45', '14:45', 'Garrons', 1772841600000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(154, 2, 82, NULL, 'Maria la înot', 0, 1772547200258, '07 martie 2026', '09:00', NULL, 'Garrons', 1772841600000, 'event', 'normal', NULL, 1772887606278, NULL, NULL, NULL),
(155, 2, 83, NULL, 'De returnat dulap la ikea', 0, 1772551481877, '15 martie 2026', '10:00', NULL, 'Ikea Lakeside', 1773532800000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(156, 2, 84, NULL, 'De sunat cofe', 1, 1772552894844, '03 martie 2026', '18:15', NULL, NULL, 1772496000000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(157, 2, 85, 'De verificat pașapoartele băieților', 'De verificat pașapoartele băieților', 0, 1772634290699, '04 aprilie 2026', NULL, NULL, NULL, 1775257200000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(158, 2, 86, NULL, 'Mini League pentru Adam', 0, 1772647143578, '14 martie 2026', '14:00', NULL, 'Garons', 1773446400000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(159, 2, 87, NULL, 'Task pentru astăzi la 8', 0, 1772694474556, '09 martie 2026', '08:00', '17:00', NULL, 1773014400000, 'event', 'normal', '[{\"text\":\"Verificat react nativ\",\"completed\":true},{\"text\":\"De plătit amenda de parcare\",\"completed\":true},{\"text\":\"Pentru Velvet Drivers\",\"completed\":false},{\"text\":\"Bază de date pentru Ștefan\",\"completed\":true},{\"text\":\"De plătit telefonul pentru România\",\"completed\":true},{\"text\":\"De găsit bilet pentru România\",\"completed\":false},{\"text\":\"De platit Romarg\",\"completed\":true},{\"text\":\"Semnătură electronică de la Simona pentru schimbarea codului KN\",\"completed\":false},{\"text\":\"Share option pt voicetask\",\"completed\":false}]', NULL, NULL, NULL, NULL),
(160, 10, 3, NULL, 'Teatru', 0, 1772723346920, '14 mars 2026', NULL, NULL, 'Teatru Cachan', 1773442800000, 'event', 'normal', '[{\"text\":\"Audiere piesa in duo\",\"completed\":false}]', NULL, NULL, NULL, NULL),
(161, 2, 88, 'Am inceput azi sa dau cu spray nazal', '', 0, 1772738327357, NULL, NULL, NULL, NULL, 1772738327357, 'task', 'normal', NULL, NULL, NULL, NULL, NULL),
(162, 2, 89, NULL, 'Intalnire audio cu Matty', 1, 1772805010725, '06 martie 2026', '16:15', NULL, NULL, 1772755200000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(163, 2, 90, NULL, 'Întâlnire cu Ștefan', 1, 1772813621772, '08 martie 2026', '18:00', '19:00', NULL, 1772928000000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(164, 2, 91, NULL, 'De luat copii de la not', 1, 1772818762227, '07 martie 2026', '07:30', NULL, NULL, 1772841600000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(165, 2, 92, 'Urgent', '', 0, 1772818783482, NULL, NULL, NULL, NULL, 1772818783482, 'task', 'normal', NULL, 1772818800005, NULL, NULL, NULL),
(166, 2, 93, 'Întâlnire cu Mati', 'Întâlnire cu Mati', 0, 1772819180631, '10 martie 2026', '18:00', NULL, NULL, 1773100800000, 'event', 'normal', NULL, NULL, NULL, NULL, NULL),
(167, 2, 94, NULL, 'De ridicat mașina de schimb', 0, 1772820172109, '16 martie 2026', '08:00', NULL, 'Ss118yq', 1773619200000, 'event', 'normal', '[{\"text\":\"Permis de conducere\",\"completed\":false},{\"text\":\"National Insurance Number\",\"completed\":false}]', NULL, NULL, NULL, NULL),
(168, 2, 95, 'Geografie', 'schita', 0, 1772887589059, NULL, NULL, NULL, NULL, 1772887589059, 'task', 'normal', NULL, 1772887596001, NULL, NULL, NULL),
(169, 2, 96, NULL, 'De trecut baza de date pentru audio task în Amazon', 0, 1772991195242, '09 martie 2026', '08:00', '09:00', NULL, 1773014400000, 'event', 'high', NULL, NULL, NULL, NULL, NULL),
(170, 2, 97, NULL, 'Ultima zi de dat cu spray nazal', 0, 1772991590110, '12 martie 2026', NULL, NULL, NULL, 1773273600000, 'event', 'high', NULL, NULL, 18, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `todo_shares`
--

CREATE TABLE `todo_shares` (
  `id` bigint NOT NULL,
  `todo_id` bigint NOT NULL,
  `owner_user_id` bigint NOT NULL,
  `shared_user_id` bigint NOT NULL,
  `created_at` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
(4, 'claudiuiancu2008@gmail.com', 'Claudiu', NULL, '$2b$10$KVi5Hzw6hZeDerAA0SUWTOuqtVzBgWMmDjATp2AuR44nM.Rhzckz6', 'credentials', NULL, '2026-02-05 17:18:50', '2026-02-05 17:18:50'),
(10, 'alexia_kin@hotmail.fr', 'Zamfir Maria', NULL, '$2b$10$wUa/EFvMfRvDlI2Bkv64AeJilpRR7/jyJCJl1IU5AXNla3GqQWvyG', 'credentials', NULL, '2026-03-01 22:46:55', '2026-03-01 22:46:55');

-- --------------------------------------------------------

--
-- Table structure for table `user_settings`
--

CREATE TABLE `user_settings` (
  `user_id` bigint NOT NULL,
  `active_tab` enum('task','event') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'task',
  `language` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'en',
  `color_scheme` varchar(10) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'light',
  `active_date_filters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  `filter_task` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'all',
  `filter_event` varchar(20) COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'all',
  `calendar_month` varchar(7) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_language` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_active_tab` enum('task','event') COLLATE utf8mb4_general_ci DEFAULT NULL,
  `default_show_subtasks` tinyint(1) NOT NULL DEFAULT '0',
  `default_font_size` enum('small','normal','large') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'normal'
) ;

--
-- Dumping data for table `user_settings`
--

INSERT INTO `user_settings` (`user_id`, `active_tab`, `language`, `color_scheme`, `active_date_filters`, `filter_task`, `filter_event`, `calendar_month`, `default_language`, `default_active_tab`, `default_show_subtasks`, `default_font_size`) VALUES
(2, 'event', 'ro', 'light', '[\"2026-2-8\",\"2026-2-9\",\"2026-2-10\",\"2026-2-11\",\"2026-2-12\",\"2026-2-13\",\"2026-2-14\",\"2026-2-15\",\"2026-2-16\",\"2026-2-17\",\"2026-2-18\",\"2026-2-19\",\"2026-2-20\",\"2026-2-21\",\"2026-2-22\",\"2026-2-23\",\"2026-2-24\",\"2026-2-25\",\"2026-2-26\",\"2026-2-27\",\"2026-2-28\",\"2026-2-29\",\"2026-2-30\",\"2026-2-31\",\"2026-3-1\",\"2026-3-2\",\"2026-3-3\",\"2026-3-4\"]', 'all|all', 'open|all', '2026-03', NULL, NULL, 1, 'small'),
(3, 'task', 'ro', 'light', '[]', 'all|all', 'all|all', '2026-02', NULL, NULL, 0, 'normal'),
(4, 'task', 'ro', 'light', '[]', 'all|all', 'all|all', '2026-02', 'ro', 'task', 1, 'normal'),
(10, 'event', 'fr', 'light', '[]', 'all|all', 'all|all', '2026-03', NULL, NULL, 0, 'normal');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `labels`
--
ALTER TABLE `labels`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_user_label_name` (`user_id`,`name`),
  ADD KEY `idx_labels_user` (`user_id`);

--
-- Indexes for table `reminder_jobs`
--
ALTER TABLE `reminder_jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reminder_jobs_due` (`status`,`scheduled_for`),
  ADD KEY `idx_reminder_jobs_todo` (`todo_id`),
  ADD KEY `fk_reminder_jobs_user` (`user_id`);

--
-- Indexes for table `todos`
--
ALTER TABLE `todos`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_todos_user_local_id` (`user_id`,`local_id`),
  ADD KEY `fk_todos_user` (`user_id`),
  ADD KEY `idx_todos_user_deleted` (`user_id`,`deleted_at`),
  ADD KEY `idx_todos_label` (`label_id`);

--
-- Indexes for table `todo_shares`
--
ALTER TABLE `todo_shares`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_todo_shares_todo_user` (`todo_id`,`shared_user_id`),
  ADD KEY `idx_todo_shares_shared_user` (`shared_user_id`),
  ADD KEY `idx_todo_shares_owner_user` (`owner_user_id`);

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
-- AUTO_INCREMENT for table `labels`
--
ALTER TABLE `labels`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `reminder_jobs`
--
ALTER TABLE `reminder_jobs`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=89;

--
-- AUTO_INCREMENT for table `todos`
--
ALTER TABLE `todos`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `todo_shares`
--
ALTER TABLE `todo_shares`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `labels`
--
ALTER TABLE `labels`
  ADD CONSTRAINT `fk_labels_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `reminder_jobs`
--
ALTER TABLE `reminder_jobs`
  ADD CONSTRAINT `fk_reminder_jobs_todo` FOREIGN KEY (`todo_id`) REFERENCES `todos` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_reminder_jobs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `todos`
--
ALTER TABLE `todos`
  ADD CONSTRAINT `fk_todos_label` FOREIGN KEY (`label_id`) REFERENCES `labels` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_todos_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `todo_shares`
--
ALTER TABLE `todo_shares`
  ADD CONSTRAINT `fk_todo_shares_owner` FOREIGN KEY (`owner_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_todo_shares_shared` FOREIGN KEY (`shared_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_todo_shares_todo` FOREIGN KEY (`todo_id`) REFERENCES `todos` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_settings`
--
ALTER TABLE `user_settings`
  ADD CONSTRAINT `fk_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
