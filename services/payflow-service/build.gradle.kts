import com.netflix.graphql.dgs.codegen.gradle.GenerateJavaTask
import org.springframework.boot.buildpack.platform.build.PullPolicy
import org.springframework.boot.gradle.tasks.bundling.BootBuildImage
import org.springframework.boot.gradle.tasks.run.BootRun

plugins {
    application
    id("org.springframework.boot") version "3.3.1"
    id("io.spring.dependency-management") version "1.1.4"
    id("com.google.cloud.artifactregistry.gradle-plugin") version "2.2.1"
    id("io.freefair.lombok") version "8.4"
    id("com.netflix.dgs.codegen") version "6.2.2"
}

application {
    mainClass.set("ua.sinaver.web3.payflow.PayflowApplication")
}

group = "ua.sinaver.web3.payflow"
version = "0.0.10-alpha"

java.sourceCompatibility = JavaVersion.VERSION_21

repositories {
    mavenCentral()
}

if (project.hasProperty("gcp")) {
    extra["springCloudGcpVersion"] = "5.3.0"
    extra["springCloudVersion"] = "2023.0.1"
}

extra["flywayVersion"] = "10.15.0"

dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-webflux")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-cache")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-actuator")
    implementation("org.springframework.boot:spring-boot-starter-graphql")
    implementation("org.springframework.session:spring-session-jdbc")
    implementation("org.springframework.boot:spring-boot-starter-aop")

    implementation("io.hypersistence:hypersistence-utils-hibernate-63:3.8.0")

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


    if (project.hasProperty("gcp")) {
        project.logger.info("Including GCP dependencies")
        // gcp
        implementation("com.google.cloud:spring-cloud-gcp-starter")
        implementation("com.google.cloud:spring-cloud-gcp-starter-sql-mysql")
        implementation("com.google.cloud:google-cloud-redis")
    } else {
        // local
        //runtimeOnly ("com.h2database:h2")
        runtimeOnly("com.mysql:mysql-connector-j:8.4.0")
    }

    // caching
    implementation("com.github.ben-manes.caffeine:caffeine")

    // redis
    implementation("org.springframework.boot:spring-boot-starter-data-redis")

    // retry
    implementation("org.springframework.retry:spring-retry")

    // db migration
    implementation("org.flywaydb:flyway-core:${property("flywayVersion")}")
    implementation("org.flywaydb:flyway-mysql:${property("flywayVersion")}")

    // utils
    implementation("org.apache.commons:commons-lang3:3.14.0")
    implementation("com.google.guava:guava:33.2.0-jre")
    implementation("com.google.code.gson:gson:2.11.0")

    // java.lang.NoSuchMethodError: 'reactor.core.publisher.Mono reactor.core.publisher.Mono.onErrorComplete()'
    implementation("io.projectreactor:reactor-core:3.6.7")

    runtimeOnly("io.netty:netty-resolver-dns-native-macos:4.1.111.Final:osx-aarch_64")

    // crypto
    implementation("org.bouncycastle:bcprov-jdk18on:1.78.1")
    implementation("org.web3j:core:4.10.3")
    implementation("org.web3j:contracts:4.10.3")
    //siwe
    implementation("com.moonstoneid:siwe-java:1.0.2")

    //lombok
    compileOnly("org.projectlombok:lombok:1.18.34")

    developmentOnly("org.springframework.boot:spring-boot-devtools")
}


dependencyManagement {
    imports {
        mavenBom("com.netflix.graphql.dgs:graphql-dgs-platform-dependencies:latest.release")

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

tasks.withType<GenerateJavaTask> {
    packageName = "ua.sinaver.web3.payflow.graphql.generated"
    generateClientv2 = true

    typeMapping["Address"] = "java.lang.String"
    typeMapping["Identity"] = "java.lang.String"
    typeMapping["Map"] = "java.util.Map"
    typeMapping["Time"] = "java.time.LocalTime"
    typeMapping["Any"] = "java.lang.String"

}

tasks.withType<BootRun> {
    if (project.hasProperty("redis")) {
        systemProperty("spring.profiles.active", "local,redis")
    } else {
        systemProperty("spring.profiles.active", "local,caffeine")
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

