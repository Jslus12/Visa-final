package VISA.example;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;

// Esta anotação avisa ao Java que este é um projeto Spring Boot
@SpringBootApplication(exclude = {DataSourceAutoConfiguration.class})
public class MainClass {

    public static void main(String[] args) {
        // Esta linha inicia o servidor Tomcat na porta 8080
        SpringApplication.run(MainClass.class, args);
    }
}