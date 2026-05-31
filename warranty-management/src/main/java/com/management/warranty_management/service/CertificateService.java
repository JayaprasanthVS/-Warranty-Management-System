package com.management.warranty_management.service;

import com.management.warranty_management.model.Warranty;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;

@Service
public class CertificateService {

    public byte[] generateWarrantyCertificate(Warranty warranty) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            PDPage page = new PDPage();
            document.addPage(page);

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                content.beginText();
                content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD), 20);
                content.newLineAtOffset(60, 720);
                content.showText("Warranty Certificate");
                content.setFont(new org.apache.pdfbox.pdmodel.font.PDType1Font(Standard14Fonts.FontName.HELVETICA), 12);
                content.newLineAtOffset(0, -40);
                content.showText("Customer: " + warranty.getUser().getName());
                content.newLineAtOffset(0, -20);
                content.showText("Email: " + warranty.getUser().getEmail());
                content.newLineAtOffset(0, -20);
                content.showText("Product: " + warranty.getProduct().getName() + " (" + warranty.getProduct().getModelNumber() + ")");
                content.newLineAtOffset(0, -20);
                content.showText("Serial Number: " + warranty.getSerialNumber());
                content.newLineAtOffset(0, -20);
                content.showText("Purchase Date: " + warranty.getPurchaseDate());
                content.newLineAtOffset(0, -20);
                content.showText("Expiry Date: " + warranty.getExpiryDate());
                content.newLineAtOffset(0, -20);
                content.showText("Status: " + warranty.getStatus().name());
                content.endText();
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new RuntimeException("Unable to generate warranty certificate.", exception);
        }
    }
}
