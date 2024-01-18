import org.springframework.boot.gradle.tasks.run.BootRun
import org.springframework.boot.gradle.tasks.bundling.BootBuildImage
import org.springframework.boot.buildpack.platform.build.PullPolicy
import com.netflix.graphql.dgs.codegen.gradle.GenerateJavaTask;

plugins {
	application
	id("org.springframework.boot") version "3.2.1"
	id("io.spring.dependency-management") version "1.1.4"
	id("com.google.cloud.artifactregistry.gradle-plugin") version "2.2.1"
	id("io.freefair.lombok") version "8.4"
	id("com.netflix.dgs.codegen") version "6.1.2"
}

application {
    mainClass.set("ua.sinaver.web3.PayFlowApplication")
}

group = "ua.sinaver.web3"
version = "0.0.4-alpha"

java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
	mavenCentral()
}

if (project.hasProperty("gcp") || project.hasProperty("gcp-dev") || project.hasProperty("gcp-local")) {
	extra["springCloudGcpVersion"] = "4.8.4"
	extra["springCloudVersion"] = "2022.0.4"
}

extra["flywayVersion"] = "10.4.1"

dependencies {
	implementation ("org.springframework.boot:spring-boot-starter-web")
	implementation ("org.springframework.boot:spring-boot-starter-webflux")
	implementation ("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation ("org.springframework.boot:spring-boot-starter-cache")
	implementation ("org.springframework.boot:spring-boot-starter-security")
	implementation ("org.springframework.boot:spring-boot-starter-actuator")
	implementation ("org.springframework.boot:spring-boot-starter-graphql")
	implementation ("org.springframework.session:spring-session-jdbc")

	/**
	 * TODO: disable for now due the following, generating types with gradle plugin is enough for now
	 * There are problems with the GraphQL Schema:
	 *          * There is no scalar implementation for the named  'Address' scalar type
	 *          * There is no scalar implementation for the named  'DateRange' scalar type
	 *          * There is no scalar implementation for the named  'Identity' scalar type
	 *          * There is no scalar implementation for the named  'IntString' scalar type
	 *          * There is no scalar implementation for the named  'Map' scalar type
	 *          * There is no scalar implementation for the named  'Range' scalar type
	 *          * There is no scalar implementation for the named  'TimeRange' scalar type
	 *
	 *
	 */
	//implementation("com.netflix.graphql.dgs:graphql-dgs-spring-boot-starter")
	//implementation("com.netflix.graphql.dgs:graphql-dgs-extended-scalars")
	//implementation("com.graphql-java:graphql-java-extended-scalars:21.0")


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

	// caching
	implementation ("com.github.ben-manes.caffeine:caffeine")

	// db migration
	implementation ("org.flywaydb:flyway-core:${property("flywayVersion")}")
	implementation ("org.flywaydb:flyway-mysql:${property("flywayVersion")}")

	// utils
	implementation("org.apache.commons:commons-lang3:3.12.0")
	implementation("com.google.guava:guava:33.0.0-jre")
   	implementation("com.google.code.gson:gson:2.10.1")

	//runtimeOnly("io.netty:netty-resolver-dns-native-macos:osx-aarch_64")

	// crypto
	implementation("org.bouncycastle:bcprov-jdk18on:1.74")

	//siwe
	implementation("com.moonstoneid:siwe-java:1.0.2")

	//lombok
	compileOnly("org.projectlombok:lombok")

	developmentOnly ("org.springframework.boot:spring-boot-devtools")
}


dependencyManagement {
  imports {
	mavenBom("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:latest.release")

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

tasks.withType<GenerateJavaTask> {
	packageName = "ua.sinaver.web3.graphql.generated"
	generateClientv2 = true

 	typeMapping.put("Address", "java.lang.String")
	typeMapping.put("Identity", "java.lang.String")
	typeMapping.put("Map", "java.util.Map")
	typeMapping.put("Time", "java.time.LocalTime")
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

