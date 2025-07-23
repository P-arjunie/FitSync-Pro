import mongoose, { Schema, Document, models, model } from "mongoose";

export interface ISiteSettings extends Document {
  logoUrl: string;
  footerText: string;
  classes: string[];
  workingHours: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  contact: {
    address: string;
    phone: string;
    email: string;
  };
  social: {
    whatsapp: string;
    instagram: string;
    facebook: string;
    linkedin: string;
  };
}

const siteSettingsSchema = new Schema<ISiteSettings>({
  logoUrl: { type: String, default: "/Logo.png" },
  footerText: { type: String, default: "© 2024 FitSync Pro. All rights reserved." },
  classes: { type: [String], default: ["Cycling", "Yoga", "Power Lifting", "Yoga", "Meditation", "Mixed Martial Arts"] },
  workingHours: {
    weekdays: { type: String, default: "Monday - Friday: 7:00 a.m. - 9:00 p.m." },
    saturday: { type: String, default: "Saturday: 7:00 a.m. - 4:00 p.m." },
    sunday: { type: String, default: "Sunday Close" },
  },
  contact: {
    address: { type: String, default: "No 4/1, Sapumal Palace Colombo" },
    phone: { type: String, default: "+94 71 278 1444" },
    email: { type: String, default: "fitsyncpro.gym@gmail.com" },
  },
  social: {
    whatsapp: { type: String, default: "https://wa.me/+94712781444" },
    instagram: { type: String, default: "https://www.instagram.com" },
    facebook: { type: String, default: "https://www.facebook.com" },
    linkedin: { type: String, default: "mailto:email@email.com" },
  },
});

const SiteSettings = models.SiteSettings || model<ISiteSettings>("SiteSettings", siteSettingsSchema);
export default SiteSettings; 