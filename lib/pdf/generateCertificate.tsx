import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import React from "react";

// Register fonts
Font.register({
  family: "Fraunces",
  src: "https://fonts.gstatic.com/s/fraunces/v31/6NUt8FyLNQOQZAnv9bYEvDiIdE9Ea92uemAk_WX25iCHv7GceVxFMQ.woff2",
  fontWeight: "bold",
});

Font.register({
  family: "DM Sans",
  src: "https://fonts.gstatic.com/s/dmsans/v14/rP2Hp2ywxg089UriCZa4ET-DNl0.woff2",
});

interface CertificateData {
  studentName: string;
  courseTitle: string;
  instructorName: string;
  certId: string;
  issuedAt: Date;
}

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#FAFAF8",
    padding: 60,
    position: "relative",
  },
  border: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    borderWidth: 2,
    borderColor: "#D97706",
    borderStyle: "solid",
  },
  logo: {
    fontSize: 12,
    fontFamily: "DM Sans",
    color: "#D97706",
    textAlign: "center",
    marginBottom: 40,
    letterSpacing: 2,
    textTransform: "uppercase" as const,
  },
  headerText: {
    fontSize: 11,
    fontFamily: "DM Sans",
    color: "#888884",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  studentName: {
    fontSize: 42,
    fontFamily: "Fraunces",
    fontWeight: "bold",
    color: "#0F0F0F",
    textAlign: "center",
    marginBottom: 20,
  },
  completedText: {
    fontSize: 13,
    fontFamily: "DM Sans",
    color: "#888884",
    textAlign: "center",
    marginBottom: 12,
  },
  courseTitle: {
    fontSize: 26,
    fontFamily: "Fraunces",
    fontWeight: "bold",
    color: "#0F0F0F",
    textAlign: "center",
    marginBottom: 8,
  },
  instructorText: {
    fontSize: 12,
    fontFamily: "DM Sans",
    color: "#888884",
    textAlign: "center",
    marginBottom: 48,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#E4E4E0",
    marginBottom: 32,
    marginHorizontal: 80,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  footerLeft: {
    alignItems: "flex-start",
  },
  footerRight: {
    alignItems: "flex-end",
  },
  footerLabel: {
    fontSize: 9,
    fontFamily: "DM Sans",
    color: "#888884",
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    marginBottom: 4,
  },
  footerValue: {
    fontSize: 11,
    fontFamily: "DM Sans",
    color: "#0F0F0F",
  },
  certIdText: {
    fontSize: 10,
    fontFamily: "DM Sans",
    color: "#D97706",
    letterSpacing: 1,
  },
  accentLine: {
    width: 60,
    height: 3,
    backgroundColor: "#D97706",
    marginBottom: 24,
    alignSelf: "center",
  },
});

function CertificatePDF({
  studentName,
  courseTitle,
  instructorName,
  certId,
  issuedAt,
}: CertificateData) {
  return (
    <Document
      title={`Certificate — ${courseTitle}`}
      author="Restless Dreamers"
      subject={`Completion Certificate for ${studentName}`}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        {/* Amber border */}
        <View style={styles.border} />

        {/* Brand */}
        <Text style={styles.logo}>🔥  Restless Dreamers</Text>

        {/* Header */}
        <Text style={styles.headerText}>Certificate of Completion</Text>

        {/* Accent line */}
        <View style={styles.accentLine} />

        {/* This is to certify that */}
        <Text style={styles.completedText}>This is to certify that</Text>

        {/* Student name */}
        <Text style={styles.studentName}>{studentName}</Text>

        {/* Has successfully completed */}
        <Text style={styles.completedText}>has successfully completed</Text>

        {/* Course title */}
        <Text style={styles.courseTitle}>{courseTitle}</Text>
        <Text style={styles.instructorText}>Instructed by {instructorName}</Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerLabel}>Issue Date</Text>
            <Text style={styles.footerValue}>{format(issuedAt, "MMMM d, yyyy")}</Text>
          </View>

          <View style={{ alignItems: "center" }}>
            <Text style={styles.footerLabel}>Certificate ID</Text>
            <Text style={styles.certIdText}>{certId}</Text>
          </View>

          <View style={styles.footerRight}>
            <Text style={styles.footerLabel}>Issued by</Text>
            <Text style={styles.footerValue}>Restless Dreamers</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function generateCertificatePdf(data: CertificateData): Promise<Buffer> {
  const buffer = await renderToBuffer(<CertificatePDF {...data} />);
  return Buffer.from(buffer);
}
