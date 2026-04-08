-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: cis_db
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `book_authors`
--

DROP TABLE IF EXISTS `book_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `book_authors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `book_id` int NOT NULL,
  `prefix` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prefix_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_book_authors` (`book_id`),
  CONSTRAINT `fk_book_authors` FOREIGN KEY (`book_id`) REFERENCES `books` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `book_authors`
--

LOCK TABLES `book_authors` WRITE;
/*!40000 ALTER TABLE `book_authors` DISABLE KEYS */;
/*!40000 ALTER TABLE `book_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `books`
--

DROP TABLE IF EXISTS `books`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `work_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `book_name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `book_name_en` text COLLATE utf8mb4_unicode_ci,
  `semester` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_year` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subject` text COLLATE utf8mb4_unicode_ci,
  `credits` int DEFAULT NULL,
  `document_link` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_book_teacher` (`teacher_id`),
  CONSTRAINT `fk_book_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `books`
--

LOCK TABLES `books` WRITE;
/*!40000 ALTER TABLE `books` DISABLE KEYS */;
/*!40000 ALTER TABLE `books` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `common_files`
--

DROP TABLE IF EXISTS `common_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `common_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ref_id` int NOT NULL COMMENT 'เก็บ id ของ research, journal หรือ conference',
  `ref_table` enum('research','journal','conference','book') COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์ต้นฉบับ',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์ใน Server',
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ref` (`ref_table`,`ref_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `common_files`
--

LOCK TABLES `common_files` WRITE;
/*!40000 ALTER TABLE `common_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `common_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conference_authors`
--

DROP TABLE IF EXISTS `conference_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conference_authors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `conference_id` int NOT NULL COMMENT 'FK: เชื่อมตาราง conferences',
  `prefix` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำนำหน้า',
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ตำแหน่ง',
  `prefix_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_conf_id` (`conference_id`),
  CONSTRAINT `fk_conf_authors` FOREIGN KEY (`conference_id`) REFERENCES `conferences` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conference_authors`
--

LOCK TABLES `conference_authors` WRITE;
/*!40000 ALTER TABLE `conference_authors` DISABLE KEYS */;
/*!40000 ALTER TABLE `conference_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conferences`
--

DROP TABLE IF EXISTS `conferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `article_title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อบทความ',
  `article_title_en` text COLLATE utf8mb4_unicode_ci,
  `conference_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ชื่องานประชุม',
  `conference_name_en` text COLLATE utf8mb4_unicode_ci,
  `conference_level` enum('national','international') COLLATE utf8mb4_unicode_ci DEFAULT 'national',
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Thailand',
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'สถานที่ประชุม',
  `edition_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ปีที่',
  `conference_date` date DEFAULT NULL COMMENT 'วันที่จัด',
  `document_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_conference_teacher` (`teacher_id`),
  CONSTRAINT `fk_conference_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conferences`
--

LOCK TABLES `conferences` WRITE;
/*!40000 ALTER TABLE `conferences` DISABLE KEYS */;
INSERT INTO `conferences` VALUES (1,2,'CTCH2001','แอปพลิเคชันติดตามและดูแลผู้ป่วยความจำเสื่อมโดยใช้ไอบีคอน','TRACKING AND TAKE CARE AMNESIA PATIENT APPLICATION BY USING iBEACON','การประชุมวิชาการนานาชาติว่าด้วยวิทยาศาสตร์ เทคโนโลยี และนวัตกรรมเทคโนโลยี',' In proceeding of The 47th International Congress on Science, Technology and Technology-based Innovation ','national','Thailand','2568','คณะศิลปศาสตร์และวิทยาศาสตร์ มหาวิทยาลัยเกษตรศาสตร์ วิทยาเขตกำแพงแสน จังหวัดนครปฐม ประเทศไทย','47','2026-03-20','','2026-03-20 06:28:51'),(2,2,'CTCH2002','เทคนิคการจำแนกประเภทแบบ Ensemble สำหรับภาพมรดกทางวัฒนธรรม','Ensemble Classification Technique for Cultural Heritage Image','การเรียนรู้ของเครื่องจักรและการสื่อสารอัจฉริยะ MLICOM 2021','Machine Learning and Intelligent Communications. MLICOM 2021','international','Japan','2568','สถาบันวิทยาศาสตร์คอมพิวเตอร์ สารสนเทศสังคม และวิศวกรรมโทรคมนาคม','4','2026-03-20','','2026-03-20 06:31:05');
/*!40000 ALTER TABLE `conferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `internships`
--

DROP TABLE IF EXISTS `internships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `internships` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสนักศึกษา เชื่อมกับตาราง students',
  `prefix_th` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_th` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_th` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `internship_type` enum('domestic','international') COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภท: ในประเทศ หรือ ต่างประเทศ',
  `place_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อสถานที่ฝึกงาน (หรือเก็บค่ารวบยอดของต่างประเทศ)',
  `country` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ประเทศ (สำหรับต่างประเทศ)',
  `city` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เมือง (สำหรับต่างประเทศ)',
  `institution` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สถาบัน/บริษัท (สำหรับต่างประเทศ)',
  `start_date` date NOT NULL COMMENT 'วันที่เริ่มฝึกงาน',
  `end_date` date NOT NULL COMMENT 'วันที่สิ้นสุดฝึกงาน',
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อไฟล์ต้นฉบับ',
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ที่อยู่ไฟล์บน Server (Path/URL)',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `reject_comment` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `internships_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `internships`
--

LOCK TABLES `internships` WRITE;
/*!40000 ALTER TABLE `internships` DISABLE KEYS */;
INSERT INTO `internships` VALUES (3,'6204062636325',NULL,NULL,NULL,'international','china - ajaj - toyota','china','ajaj','toyota','2026-04-07','2029-12-28','บทที่ 5- 6.docx','1775537828170_บทที่_5-_6.docx','2026-04-07 04:55:12','2026-04-07 04:57:48','approved',NULL),(4,'6204062636325',NULL,NULL,NULL,'domestic','toyota',NULL,NULL,NULL,'2026-04-07','2026-04-08','รายงานผลงาน_2568-2568.docx,รายงานผลงาน_2568-2568.pdf','1775543211850_รายงานผลงาน_2568-2568.docx,1775543211852_รายงานผลงาน_2568-2568.pdf','2026-04-07 06:26:51','2026-04-07 06:26:51','pending',NULL);
/*!40000 ALTER TABLE `internships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journal_authors`
--

DROP TABLE IF EXISTS `journal_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_authors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `journal_id` int NOT NULL COMMENT 'FK: เชื่อมตาราง journals',
  `prefix` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำนำหน้า',
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ตำแหน่ง',
  `prefix_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_journal_id` (`journal_id`),
  CONSTRAINT `fk_journal_authors` FOREIGN KEY (`journal_id`) REFERENCES `journals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journal_authors`
--

LOCK TABLES `journal_authors` WRITE;
/*!40000 ALTER TABLE `journal_authors` DISABLE KEYS */;
/*!40000 ALTER TABLE `journal_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `journals`
--

DROP TABLE IF EXISTS `journals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อเรื่อง',
  `title_name_en` text COLLATE utf8mb4_unicode_ci,
  `journal_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ชื่อวารสาร',
  `journal_name_en` text COLLATE utf8mb4_unicode_ci,
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `author_org` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หน่วยงานผู้แต่ง',
  `volume` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ฉบับที่',
  `edition_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ปีที่',
  `page_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เลขหน้า',
  `document_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ลิงก์เอกสาร',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_journal_teacher` (`teacher_id`),
  CONSTRAINT `fk_journal_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `journals`
--

LOCK TABLES `journals` WRITE;
/*!40000 ALTER TABLE `journals` DISABLE KEYS */;
INSERT INTO `journals` VALUES (1,2,'JTCH2001','Towards Cultural Heritage Content Retrieval by Convolution Neural Network,','Towards Cultural Heritage Content Retrieval by Convolution Neural Network','ICIC Express Letters ICIC International ','ICIC Express Letters ICIC International ','2568','','16','2','137–144','','2026-03-20 06:15:00');
/*!40000 ALTER TABLE `journals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `slug` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'view_basic_data','view_basic_data'),(2,'view_reports','view_reports'),(3,'manage_settings','manage_settings'),(4,'manage_research','manage_research'),(5,'manage_training','manage_training'),(6,'manage_works','manage_works'),(7,'manage_permissions','manage_permissions'),(8,'manage_surveys','manage_surveys'),(9,'manage_interns','manage_interns'),(10,'view_internship','view_internship'),(11,'manage_users','manage_users'),(12,'manage_insurance_reports','manage_insurance_reports');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `research_authors`
--

DROP TABLE IF EXISTS `research_authors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `research_authors` (
  `id` int NOT NULL AUTO_INCREMENT,
  `research_id` int NOT NULL COMMENT 'FK: เชื่อมตาราง researches',
  `prefix` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำนำหน้า',
  `prefix_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_en` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `position` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ตำแหน่ง/สัดส่วน',
  PRIMARY KEY (`id`),
  KEY `fk_research_id` (`research_id`),
  CONSTRAINT `fk_research_authors` FOREIGN KEY (`research_id`) REFERENCES `researches` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `research_authors`
--

LOCK TABLES `research_authors` WRITE;
/*!40000 ALTER TABLE `research_authors` DISABLE KEYS */;
INSERT INTO `research_authors` VALUES (1,1,'','','สถิตย์','Sathit','ประสมพันธ์','Prasomphan','ผู้เขียนหลัก'),(2,2,'','','test','','-','','ผู้เขียนหลัก');
/*!40000 ALTER TABLE `research_authors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `researches`
--

DROP TABLE IF EXISTS `researches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `researches` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL COMMENT 'FK: เชื่อมตาราง teachers',
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'รหัสผลงาน',
  `research_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่องานวิจัย',
  `research_name_en` text COLLATE utf8mb4_unicode_ci,
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ปีการศึกษา',
  `volume` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ฉบับที่',
  `order_no` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ลำดับ',
  `location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'สถานที่',
  `edition_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ปีที่',
  `budget` decimal(15,2) DEFAULT NULL COMMENT 'งบประมาณ',
  `organization` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'หน่วยงาน',
  `project_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'โครงการที่ทำ',
  `start_date` date DEFAULT NULL COMMENT 'วันเริ่มโครงการ',
  `publish_date` date DEFAULT NULL COMMENT 'วันเผยแพร่',
  `external_link` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'ลิงก์ภายนอก',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_research_teacher` (`teacher_id`),
  CONSTRAINT `fk_research_teacher` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `researches`
--

LOCK TABLES `researches` WRITE;
/*!40000 ALTER TABLE `researches` DISABLE KEYS */;
INSERT INTO `researches` VALUES (1,2,'RTCH2001','Towards Cultural Heritage Content Retrieval by Convolution Neural Network, ICIC Express Letters ICIC International','Towards Cultural Heritage Content Retrieval by Convolution Neural Network, ICIC Express Letters ICIC International','2568','16','2','','137–144',0.00,'','',NULL,NULL,'','2026-03-20 06:12:25'),(2,2,'RTCH2002','test','','test','','','','',0.00,'','',NULL,NULL,'','2026-03-31 08:48:55');
/*!40000 ALTER TABLE `researches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `response_details`
--

DROP TABLE IF EXISTS `response_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `response_details` (
  `id` int NOT NULL AUTO_INCREMENT,
  `response_id` int NOT NULL,
  `question_id` int NOT NULL,
  `score` int DEFAULT '0',
  `text_answer` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `fk_rd_response` (`response_id`),
  KEY `fk_rd_question` (`question_id`),
  CONSTRAINT `fk_rd_question` FOREIGN KEY (`question_id`) REFERENCES `survey_questions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rd_response` FOREIGN KEY (`response_id`) REFERENCES `survey_responses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `response_details`
--

LOCK TABLES `response_details` WRITE;
/*!40000 ALTER TABLE `response_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `response_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES (1,1),(2,1),(1,2),(2,2),(1,3),(2,3),(1,4),(2,4),(1,5),(2,5),(1,6),(2,6),(1,7),(2,7),(1,8),(2,8),(1,9),(2,9),(1,10),(3,10),(1,11),(2,11),(1,12),(2,12);
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'supperadmin','2026-03-18 18:24:42'),(2,'admin','2026-03-18 18:35:20'),(3,'student','2026-03-18 18:36:06');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_training_files`
--

DROP TABLE IF EXISTS `staff_training_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_training_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `training_id` int NOT NULL COMMENT 'เชื่อมกับตาราง staff_trainings',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'path ที่เก็บไฟล์',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_training_file` (`training_id`),
  CONSTRAINT `fk_training_file` FOREIGN KEY (`training_id`) REFERENCES `staff_trainings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_training_files`
--

LOCK TABLES `staff_training_files` WRITE;
/*!40000 ALTER TABLE `staff_training_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_training_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_trainings`
--

DROP TABLE IF EXISTS `staff_trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_id` int NOT NULL,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสผลงาน',
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา',
  `training_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทการจัดงาน',
  `training_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่องาน',
  `location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'สถานที่',
  `total_hours` int NOT NULL DEFAULT '0' COMMENT 'จำนวนชั่วโมง',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดเพิ่มเติม',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_code` (`work_code`),
  KEY `idx_staff_id` (`staff_id`),
  CONSTRAINT `fk_training_staff` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_trainings`
--

LOCK TABLES `staff_trainings` WRITE;
/*!40000 ALTER TABLE `staff_trainings` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_trainings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_work_files`
--

DROP TABLE IF EXISTS `staff_work_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_work_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_id` int NOT NULL COMMENT 'Link กลับไปที่ staff_works.id',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์บน Server',
  `original_file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิมภาษาไทย',
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  CONSTRAINT `staff_work_files_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `staff_works` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_work_files`
--

LOCK TABLES `staff_work_files` WRITE;
/*!40000 ALTER TABLE `staff_work_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_work_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_works`
--

DROP TABLE IF EXISTS `staff_works`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_works` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสผลงาน เช่น WSTF1',
  `staff_id` int NOT NULL COMMENT 'Link ไปตาราง staffs (id)',
  `academic_year` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา',
  `work_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อผลงาน',
  `organization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หน่วยงาน/สถานที่',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สถานที่',
  `work_date` date NOT NULL COMMENT 'วันที่ทำผลงาน (YYYY-MM-DD)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดผลงาน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_code` (`work_code`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `staff_works_ibfk_1` FOREIGN KEY (`staff_id`) REFERENCES `staffs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_works`
--

LOCK TABLES `staff_works` WRITE;
/*!40000 ALTER TABLE `staff_works` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_works` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staffs`
--

DROP TABLE IF EXISTS `staffs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staffs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `staff_code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix_th` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name_th` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name_th` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` int NOT NULL,
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','resigned') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT 'สถานะการทำงาน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `staff_code` (`staff_code`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_staff_role` (`role_id`),
  CONSTRAINT `fk_staff_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffs`
--

LOCK TABLES `staffs` WRITE;
/*!40000 ALTER TABLE `staffs` DISABLE KEYS */;
/*!40000 ALTER TABLE `staffs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_users`
--

DROP TABLE IF EXISTS `student_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `firstname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `lastname` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'student',
  `user_type_id` int DEFAULT '3',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_users`
--

LOCK TABLES `student_users` WRITE;
/*!40000 ALTER TABLE `student_users` DISABLE KEYS */;
INSERT INTO `student_users` VALUES (1,'s6204062636325','ธนัญกฤดิ','อัศวเตชะกฤษ','s6204062636325@kmutnb.ac.th','student',3,'2026-03-18 18:36:44'),(2,'s6304062636120','ทรงธรรม','คงสมปราชญ์','s6304062636120@kmutnb.ac.th','student',3,'2026-03-22 05:15:35');
/*!40000 ALTER TABLE `student_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_work_files`
--

DROP TABLE IF EXISTS `student_work_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_work_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_id` int NOT NULL COMMENT 'Link กลับไปที่ student_works.id',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์บน Server',
  `original_file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิมภาษาไทย',
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  CONSTRAINT `student_work_files_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `student_works` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_work_files`
--

LOCK TABLES `student_work_files` WRITE;
/*!40000 ALTER TABLE `student_work_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_work_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_works`
--

DROP TABLE IF EXISTS `student_works`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_works` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสผลงาน เช่น W6610011',
  `student_id` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Link ไปตาราง students (student_id)',
  `academic_year` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา',
  `work_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อผลงาน',
  `organization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หน่วยงาน/สถานที่',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สถานที่',
  `work_date` date NOT NULL COMMENT 'วันที่ทำผลงาน (YYYY-MM-DD)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดผลงาน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_code` (`work_code`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_works_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`student_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_works`
--

LOCK TABLES `student_works` WRITE;
/*!40000 ALTER TABLE `student_works` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_works` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `student_id` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix_th` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name_th` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name_th` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`student_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES ('6204062636325',NULL,NULL,NULL,'active','2026-03-20 07:18:47','2026-03-20 07:18:47'),('6304062636120',NULL,NULL,NULL,'active','2026-03-22 05:16:15','2026-03-22 05:16:15');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_questions`
--

DROP TABLE IF EXISTS `survey_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `topic_id` int NOT NULL,
  `question_text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_index` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_question_topic` (`topic_id`),
  CONSTRAINT `fk_question_topic` FOREIGN KEY (`topic_id`) REFERENCES `survey_topics` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=998813 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_questions`
--

LOCK TABLES `survey_questions` WRITE;
/*!40000 ALTER TABLE `survey_questions` DISABLE KEYS */;
INSERT INTO `survey_questions` VALUES (101218,827810,'เปิดโอกาสให้นักศึกษาสามรถเข้าพบได้สะดวกและมีเวลาให้อย่างเพียงพอ',5),(114894,535966,'ความจุของห้องเรียน',5),(184600,544094,'ความสะอาดบริเวณชั้น 6',1),(203722,544094,'สภาพแวดล้อม/ภูมิทัศน์โดยรวม',7),(248610,411176,'[ความสะอาดของห้อง',10),(275638,535966,'สภาพของเครื่องคอมพิวเตอร์เหมาะกับการเรียนการสอน',2),(282658,827810,'รับฟังความคิดเห็นของนักศึกษา เอาใจใส่นักศึกษาอย่างทั่วถึงและเท่าเทียม',2),(322733,411176,'การเปิด/ปิด ห้องปฏิบัติการ',13),(323130,544094,'ความรู้สึกปลอดภัยในชีวิตและทรัพย์สิน',4),(362091,535966,'แสงสว่างภายในห้อง',7),(364191,535966,'ไม่มีเสียงรบกวนขณะเรียน',10),(366644,839542,'กิจกรรมเสริมหลักสูตรเพื่อเตรียมความพร้อมในการทำงาน เช่น การฝึกงาน การศึกษาดูงาน การฝึกอบรม เป็นต้น',2),(397644,535966,'ระบบเครื่องเสียง',4),(408947,877842,'ความพึงพอใจในด้านกายภาพ ห้องเรียน ห้องปฏิบัติการ และอุปกรณ์การศึกษา',3),(411288,827810,'มีความเต็มใจและยินดีทำหน้าที่อาจารย์ที่ปรึกษา',3),(469880,877842,'ความพึงพอใจในความสะอาดของอาคาร',1),(472302,600843,'ความเหมาะสมของรายวิชาและการจัดตารางสอนในแต่ละภาคการศึกษา',2),(484040,411176,'แสงสว่างภายในห้อง',8),(497865,411176,'สภาพของอุปกรณ์พร้อมใช้งาน',3),(506744,411176,'สภาพโต๊ะ เก้าอี้',6),(510835,535966,'อุณหภูมิ/เครื่องปรับอากาศ',6),(541230,716849,'สื่อประกอบการเรียนการสอนมีความเหมาะสม และเอื้อให้เกิดประโยชน์ต่อการสนับสนุนการเรียนรู้',2),(549891,544094,'ความเป็นระเบียบเรียบร้อยของพื้นที่',5),(574573,600843,'คุณภาพการสอนและทักษะในการถ่ายทอดความรู้ของคณาจารย์ในหลักสูตร',3),(588521,535966,'ความสะอาดของห้อง',8),(591244,827810,'สามารถช่วยแก้ไขปัญหาและให้คำแนะนำให้กับนักศึกษาได้อย่างเหมาะสม',4),(603554,411176,'ระบบเครือข่าย/อินเทอร์เน็ตในห้องปฏิบัติการ',12),(629585,411176,'คุณภาพของอุปกรณ์เหมาะกับการเรียนการสอน',4),(662741,411176,'มีห้องปฏิบัติการเพียงพอ',1),(665562,411176,'การจัดวางเครื่องคอมพิวเตอร์',2),(683605,544094,'จำนวนถังขยะ/การจัดเก็บขยะ',2),(726185,411176,'เจ้าหน้าที่ให้ความช่วยเหลือและแก้ไขปัญหาอย่างรวดเร็ว',11),(772555,544094,'แสงสว่าง',3),(776717,716849,'อุปกรณ์โสตทัศนูปกรณ์ในห้องเรียนห้องปฏิบัติการ มีความพร้อมและมีปริมาณเพียงพอ',1),(807782,877842,'ความพึงพอใจในระบบสาธารณูปโภคและรักษาความปลอดภัยของอาคาร',4),(828302,535966,'การเปิด/ปิดห้องเรียน',9),(832939,877842,'ความพึงพอใจในการจัดสถานที่เพื่อพักผ่อนโดยรอบอาคาร',2),(845084,535966,'ระบบเครือข่าย/อินเทอร์เน็ตในห้องเรียน',11),(848709,839542,'การประชาสัมพันธ์เผยแพร่ข้อมูลข่าวสารและการรับสมัครงาน',1),(877219,544094,'ระบบการป้องกันอัคคีภัยและความพร้อมของทางหนีไฟ',6),(904550,600843,'มีการจัดการเรียนการสอนตรงตามเป้าประสงค์ของหลักสูตร',1),(909658,535966,'มีห้องเรียนเพียงพอ',1),(927664,411176,'อุณหภูมิ/เครื่องปรับอากาศ',7),(952084,411176,'ซอฟต์แวร์ในเครื่อง',5),(952859,827810,'อาจารย์ที่ปรึกษารู้บทบาทหน้าที่ และกฎระเบียบที่จำเป็น',1),(959162,535966,'สภาพโต๊ะ/เก้าอี้',3),(970438,411176,'ความสะอาดของอุปกรณ์',9),(973800,827810,'มีการให้บริการคำปรึกษา แนะแนว ทั้งด้านการเรียน การประกอบอาชีพ และการใช้ชีวิต',6),(998803,716849,'การใช้งานระบบอินเตอร์เน็ตมีความเสถียรภาพและมีความรวดเร็ว',3),(998804,961244,'ห้องน้ำเพียงพอ',1),(998805,961244,'ความสะอาดของห้องน้ำโซน A (หน้าห้องธุรการ)]',2),(998806,961244,'ความสะอาดของห้องน้ำโซน B (ริมคลอง)]',3),(998807,961244,'ความรู้สึกปลอดภัยในการใช้ห้องน้ำโซน A  (หน้าห้องธุรการ)]',4),(998808,961244,'แสงสว่างภายในห้องน้ำโซน A  (หน้าห้องธุรการ)',5),(998809,961244,'อุปกรณ์ในน้ำโซน A (หน้าห้องธุรการ) พร้อมใช้งาน',6),(998810,961244,'แสงสว่างภายในห้องน้ำโซน B (ริมคลอง) ',7),(998811,961244,'อุปกรณ์ในน้ำโซน B (ริมคลอง) พร้อมใช้งาน',8),(998812,961244,'ความรู้สึกปลอดภัยในการใช้ห้องน้ำโซน B (ริมคลอง)',9);
/*!40000 ALTER TABLE `survey_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_responses`
--

DROP TABLE IF EXISTS `survey_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `respondent_type` enum('student','general') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `username` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `general_org_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `general_company` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `general_email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suggestion` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `submitted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_survey` (`survey_id`),
  KEY `idx_user` (`username`),
  CONSTRAINT `fk_response_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_responses`
--

LOCK TABLES `survey_responses` WRITE;
/*!40000 ALTER TABLE `survey_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_student_years`
--

DROP TABLE IF EXISTS `survey_student_years`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_student_years` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `year_prefix` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ssy_survey` (`survey_id`),
  CONSTRAINT `fk_ssy_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_student_years`
--

LOCK TABLES `survey_student_years` WRITE;
/*!40000 ALTER TABLE `survey_student_years` DISABLE KEYS */;
INSERT INTO `survey_student_years` VALUES (1,226819,'62'),(2,226819,'63'),(3,226819,'64'),(4,226819,'65'),(5,226819,'66'),(6,226819,'67'),(7,463376,'62'),(8,463376,'63'),(9,463376,'64'),(10,463376,'65'),(11,463376,'66'),(12,463376,'67'),(13,798011,'62'),(14,798011,'63'),(15,798011,'64'),(16,798011,'65'),(17,798011,'66'),(18,798011,'67'),(19,102992,'62'),(20,102992,'63'),(21,102992,'64'),(22,102992,'65'),(23,102992,'66'),(24,102992,'67'),(31,350065,'62'),(32,350065,'63'),(33,350065,'64'),(34,350065,'65'),(35,350065,'66'),(36,350065,'67');
/*!40000 ALTER TABLE `survey_student_years` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_topics`
--

DROP TABLE IF EXISTS `survey_topics`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_topics` (
  `id` int NOT NULL AUTO_INCREMENT,
  `survey_id` int NOT NULL,
  `topic_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_index` int DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `fk_topic_survey` (`survey_id`),
  CONSTRAINT `fk_topic_survey` FOREIGN KEY (`survey_id`) REFERENCES `surveys` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=961245 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_topics`
--

LOCK TABLES `survey_topics` WRITE;
/*!40000 ALTER TABLE `survey_topics` DISABLE KEYS */;
INSERT INTO `survey_topics` VALUES (411176,463376,'ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องปฏิบัติการคอมพิวเตอร์',1),(535966,798011,'ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องเรียน',1),(544094,102992,'ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับอาคารสถานที่บริเวณชั้น 6',1),(600843,226819,'ด้านการจัดการเรียนการสอน (สำหรับการเรียนในห้องเรียน)',1),(716849,226819,'ด้านความพร้อมของสิ่งอำนวยความสะดวกหรือทรัพยากรที่เอื้อต่อการสนับสนุนการเรียนรู้   ',3),(827810,226819,'ด้านการให้คำปรึกษาและอาจารย์ที่ปรึกษา ',5),(839542,226819,'ด้านการเตรียมความพร้อมเพื่อการทำงาน',4),(877842,226819,'ด้านความพร้อมของสิ่งสนับสนุนการเรียนการสอน สิ่งสนับสนุนการเรียนรู้ และสิ่งอำนวยความสะดวกอื่นๆ  ',2),(961244,350065,'ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องน้ำชั้น 6',1);
/*!40000 ALTER TABLE `survey_topics` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `surveys`
--

DROP TABLE IF EXISTS `surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `surveys` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_group` enum('general','student') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'general',
  `academic_year` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `start_at` datetime DEFAULT NULL,
  `end_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=798012 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `surveys`
--

LOCK TABLES `surveys` WRITE;
/*!40000 ALTER TABLE `surveys` DISABLE KEYS */;
INSERT INTO `surveys` VALUES (102992,'S20260320-134355','ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับอาคารสถานที่บริเวณชั้น 6','student','2568',1,NULL,NULL,'2026-03-20 06:43:55','2026-03-20 06:43:55'),(226819,'S20260320-13381','แบบสอบถามความพึงพอใจของนักศึกษาคณะวิทยาศาสตร์ประยุกต์ สาขาวิชาวิทยาการคอมพิวเตอร์ (CS) \n','student','2568',1,NULL,NULL,'2026-03-20 06:38:01','2026-03-20 06:38:01'),(350065,'S20260320-134531','ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องน้ำชั้น 6','student','2568',1,NULL,NULL,'2026-03-20 06:45:31','2026-03-20 06:45:31'),(463376,'S20260320-134031','ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องปฏิบัติการคอมพิวเตอร์','student','2568',1,NULL,NULL,'2026-03-20 06:40:31','2026-03-20 06:40:31'),(798011,'S20260320-134220','ความพึงพอใจของนักศึกษาปัจจุบันเกี่ยวกับห้องเรียน','student','2568',1,NULL,NULL,'2026-03-20 06:42:20','2026-03-20 06:42:20');
/*!40000 ALTER TABLE `surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_degrees`
--

DROP TABLE IF EXISTS `teacher_degrees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_degrees` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL,
  `degree_level` enum('Bachelor','Master','Doctor','Diploma','Other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Bachelor',
  `degree_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อวุฒิการศึกษา',
  `institution` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สถาบันการศึกษา',
  `major` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สาขาวิชาเอก',
  `graduation_year` varchar(4) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ปีที่จบ',
  PRIMARY KEY (`id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `teacher_degrees_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_degrees`
--

LOCK TABLES `teacher_degrees` WRITE;
/*!40000 ALTER TABLE `teacher_degrees` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_degrees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_training_files`
--

DROP TABLE IF EXISTS `teacher_training_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_training_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `training_id` int NOT NULL COMMENT 'เชื่อมกับตาราง teacher_trainings',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิม',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์ใน Server',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tt_file` (`training_id`),
  CONSTRAINT `fk_tt_file` FOREIGN KEY (`training_id`) REFERENCES `teacher_trainings` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_training_files`
--

LOCK TABLES `teacher_training_files` WRITE;
/*!40000 ALTER TABLE `teacher_training_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_training_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_trainings`
--

DROP TABLE IF EXISTS `teacher_trainings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_trainings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_id` int NOT NULL COMMENT 'เชื่อมกับตาราง teachers',
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสผลงาน Auto (เช่น TTCH1001)',
  `academic_year` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา',
  `training_type` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ประเภทการจัดงาน',
  `training_name` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่องาน',
  `location` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'สถานที่',
  `total_hours` int NOT NULL DEFAULT '0' COMMENT 'จำนวนชั่วโมง',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดเพิ่มเติม',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_code` (`work_code`),
  KEY `idx_teacher_id` (`teacher_id`),
  CONSTRAINT `fk_teacher_training_owner` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_trainings`
--

LOCK TABLES `teacher_trainings` WRITE;
/*!40000 ALTER TABLE `teacher_trainings` DISABLE KEYS */;
INSERT INTO `teacher_trainings` VALUES (1,2,'TTCH2001','2566','การจัดสัมมนา/เชิงปฏิบัติการ','การสอนแนวใหม่  พร้อมจัดทำแผนการปฏิบัติงานประจำปี 2566','ณ ห้องประชุมภาควิชาวิทยาการการพัฒนาโครงงานพิเศษเชิงนวัตกรรมด้านวิทยาการ-คอมพิวเตอร์ และศึกษาดูงานเพื่อส่งเสริมและพัฒนานวัตกรรมการจัดการเรียน-คอมพิวเตอร์และสารสนเทศ ชั้น 6 อาคาร 78 คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยี-พระจอมเกล้าพระนครเหนือ ',24,'โครงการสัมมนาเชิงปฏิบัติการเรื่อง “การสอนแนวใหม่ \r\nพร้อมจัดทำแผนการปฏิบัติงานประจำปี 2566” ในวันที่ 6 ธันวาคม 2565 ณ ห้องประชุมภาควิชาวิทยาการการพัฒนาโครงงานพิเศษเชิงนวัตกรรมด้านวิทยาการ-คอมพิวเตอร์ และศึกษาดูงานเพื่อส่งเสริมและพัฒนานวัตกรรมการจัดการเรียน-คอมพิวเตอร์และสารสนเทศ ชั้น 6 อาคาร 78 คณะวิทยาศาสตร์ประยุกต์ มหาวิทยาลัยเทคโนโลยี-พระจอมเกล้าพระนครเหนือ และระหว่างวันที่ 7-9 ธันวาคม 2565 ณ ศูนย์นวัตกรรมการสอนและการเรียนรู้ มหาวิทยาลัยเชียงใหม่ และโรงแรมเซ็นทารา ริเวอร์ไซต์ เชียงใหม่ จังหวัดเชียงใหม่\r\n','2026-03-17','2026-03-20','2026-03-20 06:20:01','2026-03-20 06:20:01'),(2,2,'TTCH2002','2566','การจัดสัมมนา/เชิงปฏิบัติการ','แผนยุทธศาสตรการ พัฒนาคณะวิทยาศาสตรประยุกต ในชวงแผนพัฒนาการศึกษาระดับอุดมศึกษา ','ห้อง 78-216 ชั้น 2 คณะวิทยาศาสตร์ประยุกต์',242,'โครงการสัมมนาเชิงปฏิบัติการ เรื่อง \"แผนยุทธศาสตรการ\r\nพัฒนาคณะวิทยาศาสตรประยุกต ในชวงแผนพัฒนาการศึกษาระดับอุดมศึกษา ฉบับที่ 13\r\n(พ.ศ.2566-2570)\" ระหว่างวันที่ 10-12 พฤษภาคม 2566 เวลา 08.00 - 16.00 น. ณ ห้อง 78-223 และห้อง 78-216 ชั้น 2 คณะวิทยาศาสตร์ประยุกต์\r\n','2026-03-10','2026-03-13','2026-03-20 06:21:34','2026-03-20 06:21:34');
/*!40000 ALTER TABLE `teacher_trainings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_work_files`
--

DROP TABLE IF EXISTS `teacher_work_files`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_work_files` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_id` int NOT NULL COMMENT 'Link กลับไปที่ teacher_works.id',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์บน Server',
  `original_file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อไฟล์เดิมภาษาไทย',
  PRIMARY KEY (`id`),
  KEY `work_id` (`work_id`),
  CONSTRAINT `teacher_work_files_ibfk_1` FOREIGN KEY (`work_id`) REFERENCES `teacher_works` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_work_files`
--

LOCK TABLES `teacher_work_files` WRITE;
/*!40000 ALTER TABLE `teacher_work_files` DISABLE KEYS */;
/*!40000 ALTER TABLE `teacher_work_files` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teacher_works`
--

DROP TABLE IF EXISTS `teacher_works`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_works` (
  `id` int NOT NULL AUTO_INCREMENT,
  `work_code` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสผลงาน เช่น WTCH11',
  `teacher_id` int NOT NULL COMMENT 'Link ไปตาราง teachers (id)',
  `academic_year` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ปีการศึกษา',
  `work_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'ชื่อผลงาน',
  `organization` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'หน่วยงาน/สถานที่',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'สถานที่',
  `work_date` date NOT NULL COMMENT 'วันที่ทำผลงาน (YYYY-MM-DD)',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT 'รายละเอียดผลงาน',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `work_code` (`work_code`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `teacher_works_ibfk_1` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teacher_works`
--

LOCK TABLES `teacher_works` WRITE;
/*!40000 ALTER TABLE `teacher_works` DISABLE KEYS */;
INSERT INTO `teacher_works` VALUES (1,'WTCH21',2,'2568','Thai Ornamental Fish Trading Platform ','cis kmutnb','SCIENCE EXHIBITION Week ','2026-03-20','โครงงานเรื่อง Thai Ornamental Fish Trading Platform ได้รับรางวัลจากการเข้าร่วมประกวดผลงานในงาน SCIENCE EXHIBITION Week 2021 จัดโดยคณะวิทยาศาสตร์ประยุกต์ ในระหว่างวันที่ 29 มีนาคม- 2 เมษายน 2564 มีอาจารย์ที่ปรึกษาคือ  ผู้ช่วยศาสตราจารย์ สถิตย์ ประสมพันธ์ และผู้ช่วยศาสตราจารย์นนทกร สถิตานนท์ ได้รับรางวัลเหรียญทอง The Best Presentation Award','2026-03-20 06:26:11','2026-03-20 06:32:37');
/*!40000 ALTER TABLE `teacher_works` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `teacher_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'รหัสอาจารย์ (Auto) เช่น TCH1',
  `prefix_th` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำนำหน้า (ไทย)',
  `first_name_th` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name_th` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prefix_en` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'คำนำหน้า (อังกฤษ)',
  `first_name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name_en` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `short_name` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'ชื่อย่ออาจารย์ เช่น SSP, AB',
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'เก็บรหัสผ่านที่ Hash แล้ว (Bcrypt)',
  `photo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'เก็บชื่อไฟล์ เช่น profile_tch1.jpg',
  `role_id` int NOT NULL COMMENT 'Link ไปตาราง roles (userTypeId)',
  `status` enum('active','inactive','resigned','study_leave') COLLATE utf8mb4_unicode_ci DEFAULT 'active' COMMENT 'สถานะ',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_code` (`teacher_code`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `short_name` (`short_name`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,'TCH1','นาย','เจ้าหน้าที่','ดูแลระบบ','Mr.','super','admin','SAD','admincis123@gmail.com','$2b$10$hnU2Yv0tFa1bv5VBvt9qd.hPOGrpT.p1dZ3fcFlq4HB9hRVkqVFv2',NULL,1,'active','2026-03-18 18:33:12','2026-03-18 18:33:12'),(2,'TCH2','ผศ.','สถิตย์','ประสมพันธ์','Asst. Prof.',' Sathit','Prasomphan','SSP','ssp@gmail.com','$2b$10$Bb/ISQgY8kru3ABPEwZL5uOR0xk7ym.QwQZ4PZqzzgjLMz5CsLFGK','1773986786079_Screenshot_2026-03-04_221412.png',2,'active','2026-03-20 06:06:26','2026-03-20 06:06:26'),(3,'TCH3','นาย','ทดสอบ','ระบบ','Mr.','test','web','TEST','test@gmail.com','$2b$10$ORCctuImWdnj0tZdLuoGpOzIhQ4UkGoDJU/zV71JhPMFArTHg6Y0i',NULL,1,'active','2026-04-07 04:59:04','2026-04-07 04:59:04');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-07 22:32:21
