import org.springframework.boot.gradle.tasks.bundling.BootBuildImage

plugins {
	java
	id("org.springframework.boot") version "3.1.1"
	id("io.spring.dependency-management") version "1.1.0"
	//id("org.graalvm.buildtools.native") version "0.9.20"
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
	
	// utils
	implementation("org.apache.commons:commons-lang3:3.12.0")
	implementation("org.bouncycastle:bcprov-jdk18on:1.73")
	implementation("com.google.guava:guava:31.1-jre")
   	implementation("com.google.code.gson:gson:2.10.1")

	developmentOnly ("org.springframework.boot:spring-boot-devtools")
	
	//runtimeOnly ("com.h2database:h2")
  	runtimeOnly ("com.mysql:mysql-connector-j")

	testImplementation ("org.springframework.boot:spring-boot-starter-test")
	testImplementation ("org.springframework.amqp:spring-rabbit-test")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

// update docker image for M1 architecture
tasks.withType<BootBuildImage> {
	val osName = System.getProperty("os.name").lowercase()
	val arch = System.getProperty("os.arch")

	val runningOnM1Mac = "mac" in osName && arch == "aarch64"
	if (runningOnM1Mac) {
		builder.set("dashaun/builder:tiny")
		//environment.set(mapOf("BP_NATIVE_IMAGE" to "true"))
	}
}
