import { db } from "../server/db";
import { blogs } from "@shared/schema";

const blogData = [
  { title: "Discovering Your Dosha", description: "Learn how Ayurveda identifies your Vata, Pitta, or Kapha type and uses it to guide personalized wellness care.", category: "Consultation" },
  { title: "The Ayurvedic Consultation Process", description: "Learn how Ayurveda identifies your Vata, Pitta, or Kapha type and uses it to guide personalized wellness care.", category: "Consultation" },
  { title: "The Healing Power of Oil Massage", description: "Explore how warm herbal oil massage supports relaxation, circulation, and stress relief.", category: "Therapy" },
  { title: "Ayurvedic Therapies for Daily Balance", description: "Discover traditional therapies that help restore harmony in the body and mind.", category: "Therapy" },
  { title: "Herbal Remedies for Better Wellness", description: "Learn how herbs and natural preparations are used in Ayurvedic care.", category: "Consultation" },
  { title: "Ayurvedic Self-Care Rituals", description: "See how daily routine, massage, and mindful habits can support long-term well-being.", category: "Therapy" },
];

await db.insert(blogs).values(blogData);
console.log("✓ 6 blogs inserted successfully!");
process.exit(0);
