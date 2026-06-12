import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { type CVData } from "@/lib/cv/schema";

const palette = {
  classic: {
    primary: "#111827",
    accent: "#374151",
    light: "#f8fafc",
  },
  modern: {
    primary: "#0f766e",
    accent: "#f59e0b",
    light: "#ecfdf5",
  },
  minimal: {
    primary: "#334155",
    accent: "#0f766e",
    light: "#f8fafc",
  },
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0f172a",
    backgroundColor: "#ffffff",
  },
  header: {
    borderBottom: "2 solid #0f172a",
    paddingBottom: 14,
    marginBottom: 18,
  },
  name: {
    fontSize: 25,
    fontWeight: 700,
  },
  role: {
    marginTop: 5,
    fontSize: 12,
    color: "#475569",
  },
  contact: {
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    color: "#475569",
  },
  section: {
    marginTop: 15,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paragraph: {
    lineHeight: 1.55,
    color: "#334155",
  },
  job: {
    marginBottom: 14,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  jobTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  dates: {
    fontSize: 9,
    color: "#64748b",
  },
  company: {
    marginTop: 2,
    fontSize: 10,
    color: "#475569",
  },
  bullet: {
    marginTop: 4,
    lineHeight: 1.5,
    color: "#334155",
  },
  twoCol: {
    marginTop: 16,
    flexDirection: "row",
    gap: 28,
  },
  col: {
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    border: "1 solid #cbd5e1",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 5,
  },
});

export function CvPdfDocument({ data }: { data: CVData }) {
  const colors = palette[data.template];

  return (
    <Document
      title={`${data.personal.fullName} CV`}
      author={data.personal.fullName}
      subject={data.targetRole}
    >
      <Page
        size="A4"
        style={
          data.template === "modern"
            ? [
                styles.page,
                {
                  borderLeftColor: colors.primary,
                  borderLeftStyle: "solid",
                  borderLeftWidth: 18,
                },
              ]
            : styles.page
        }
      >
        <View style={[styles.header, { borderBottomColor: colors.primary }]}>
          <Text style={[styles.name, { color: colors.primary }]}>
            {data.personal.fullName}
          </Text>
          <Text style={styles.role}>{data.targetRole}</Text>
          <View style={styles.contact}>
            <Text>{data.personal.email}</Text>
            <Text>{data.personal.phone}</Text>
            <Text>{data.personal.location}</Text>
            {data.personal.linkedIn ? <Text>{data.personal.linkedIn}</Text> : null}
            {data.personal.website ? <Text>{data.personal.website}</Text> : null}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>Resumen</Text>
          <Text style={styles.paragraph}>{data.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.accent }]}>
            Experiencia
          </Text>
          {data.experience.map((item) => (
            <View key={`${item.company}-${item.role}`} style={styles.job}>
              <View style={styles.jobHeader}>
                <Text style={styles.jobTitle}>{item.role}</Text>
                <Text style={styles.dates}>
                  {item.startDate} - {item.endDate}
                </Text>
              </View>
              <Text style={styles.company}>{item.company}</Text>
              {item.bullets.map((bullet) => (
                <Text key={bullet} style={styles.bullet}>
                  - {bullet}
                </Text>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              Educación
            </Text>
            {data.education.map((item) => (
              <View key={`${item.institution}-${item.degree}`} style={{ marginBottom: 8 }}>
                <Text style={styles.jobTitle}>{item.degree}</Text>
                <Text style={styles.company}>{item.institution}</Text>
                <Text style={styles.dates}>{item.year}</Text>
              </View>
            ))}
          </View>
          <View style={styles.col}>
            <Text style={[styles.sectionTitle, { color: colors.accent }]}>
              Habilidades
            </Text>
            <View style={styles.chipRow}>
              {data.skills.map((skill) => (
                <Text key={skill} style={styles.chip}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
