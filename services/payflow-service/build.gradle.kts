import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
	application
	id("org.springframework.boot") version "3.1.2"
	id("io.spring.dependency-management") version "1.1.0"
	//id("com.google.cloud.tools.jib") version "3.3.2" - jib
}

application {
    mainClass.set("ua.sinaver.web3.PayFlowApplication")
}

if (project.hasProperty("gcp")) {
	extra["springCloudGcpVersion"] = "4.5.1"
	extra["springCloudVersion"] = "2022.0.3"
}

group = "ua.sinaver.web3"
version = "0.0.1-SNAPSHOT"
java.sourceCompatibility = JavaVersion.VERSION_17

repositories {
	mavenCentral()
}

dependencies {
	implementation ("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation ("org.springframework.boot:spring-boot-starter-web")
	
	if (project.hasProperty("gcp")) {
		project.logger.info("Including GCP dependencies")
		// gcp
		implementation ("com.google.cloud:spring-cloud-gcp-starter")
		implementation ("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")	
	} else {
		// local
		//runtimeOnly ("com.h2database:h2")
  		runtimeOnly ("com.mysql:mysql-connector-j")
	}

	// utils
	implementation("org.apache.commons:commons-lang3:3.12.0")
	implementation("org.bouncycastle:bcprov-jdk18on:1.73")
	implementation("com.google.guava:guava:31.1-jre")
   	implementation("com.google.code.gson:gson:2.10.1")

	developmentOnly ("org.springframework.boot:spring-boot-devtools")
}


dependencyManagement {
  imports {
	if (project.hasProperty("gcp")) {
		// gcp
    	mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:${property("springCloudGcpVersion")}")
    	mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")
	}
  }
}

tasks.withType<Test> {
	useJUnitPlatform()
}

// gradlew 
tasks.withType<BootRun> {
	if (project.hasProperty("gcp")) {
		systemProperty("spring.profiles.active", "gcp")
	}	
}
