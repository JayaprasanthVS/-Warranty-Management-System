package com.management.warranty_management;

import com.management.warranty_management.config.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties(StorageProperties.class)
public class WarrantyManagementApplication {

	public static void main(String[] args) {
		SpringApplication.run(WarrantyManagementApplication.class, args);
	}

}
