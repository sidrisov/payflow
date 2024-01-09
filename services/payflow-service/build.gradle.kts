import org.springframework.boot.gradle.tasks.run.BootRun
import org.springframework.boot.gradle.tasks.bundling.BootBuildImage
import org.springframework.boot.buildpack.platform.build.PullPolicy

plugins {
	application
	id("org.springframework.boot") version "3.2.1"
	id("io.spring.dependency-management") version "1.1.4"
	id("com.google.cloud.artifactregistry.gradle-plugin") version "2.2.1"
	id("io.freefair.lombok") version "8.4"
}

application {
    mainClass.set("ua.sinaver.web3.PayFlowApplication")
}

if (project.hasProperty("gcp") || project.hasProperty("gcp-dev") || project.hasProperty("gcp-local")) {
	extra["springCloudGcpVersion"] = "4.8.4"
	extra["springCloudVersion"] = "2022.0.4"
}

group = "ua.sinaver.web3"
version = "0.0.3-alpha"

java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
	mavenCentral()
}

dependencies {
	implementation ("org.springframework.boot:spring-boot-starter-web")
	implementation ("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation ("org.springframework.boot:spring-boot-starter-security")
	implementation ("org.springframework.boot:spring-boot-starter-actuator")
	implementation ("org.springframework.session:spring-session-jdbc")

	if (project.hasProperty("gcp") || project.hasProperty("gcp-dev") || project.hasProperty("gcp-local")) {
		project.logger.info("Including GCP dependencies")
		// gcp
		implementation ("com.google.cloud:spring-cloud-gcp-starter")
		implementation ("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")	
	} else {
		// local
		//runtimeOnly ("com.h2database:h2")
  		runtimeOnly ("com.mysql:mysql-connector-j")
	}

	implementation ("org.flywaydb:flyway-core:10.4.1")
	implementation ("org.flywaydb:flyway-mysql:10.4.1")

	// utils
	implementation("org.apache.commons:commons-lang3:3.12.0")
	implementation("com.google.guava:guava:31.1-jre")
   	implementation("com.google.code.gson:gson:2.10.1")

	// crypto
	implementation("org.bouncycastle:bcprov-jdk18on:1.73")

	//siwe
	// TODO: it's ok to use as long as we're not in production
	implementation("com.moonstoneid:siwe-java:1.0.2")

	//lombok
	compileOnly("org.projectlombok:lombok")

	developmentOnly ("org.springframework.boot:spring-boot-devtools")
}


dependencyManagement {
  imports {
	if (project.hasProperty("gcp") || project.hasProperty("gcp-dev") || project.hasProperty("gcp-local")) {
		// gcp
    	mavenBom("com.google.cloud:spring-cloud-gcp-dependencies:${property("springCloudGcpVersion")}")
    	mavenBom("org.springframework.cloud:spring-cloud-dependencies:${property("springCloudVersion")}")
	}
  }
}

tasks.withType<Test> {
	useJUnitPlatform()
}

tasks.withType<BootRun> {
	if (project.hasProperty("gcp")) {
		systemProperty("spring.profiles.active", "gcp")
	}

	if (project.hasProperty("gcp-dev")) {
		systemProperty("spring.profiles.active", "gcp-dev")
	}

	if (project.hasProperty("gcp-local")) {
		systemProperty("spring.profiles.active", "gcp-local")
	}
}

// gradle -d  bootBuildImage -P{profile} \                                    ✘ INT  10:54:12
// -Pgcp-image-name={artifactory}/{repository}/{image} \
// --publishImage
// TODO: permissions are not picked up for publishing - https://cloud.google.com/artifact-registry/docs/java/authentication#gcloud
 tasks.named<BootBuildImage>("bootBuildImage") {
	if (project.hasProperty("gcp-image-name")) {
    	imageName.set("${project.property("gcp-image-name")}:${project.version}")
	}
	pullPolicy.set(PullPolicy.IF_NOT_PRESENT)
	//publish.set(true)
}

