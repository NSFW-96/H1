'use client';

import React from 'react';
import { motion } from "framer-motion";
import { Button } from '../../components/ui/button';
import { ArrowRight, Check, Heart, Shield, Award, Clock, Zap } from 'lucide-react';
import Link from 'next/link';
import Logo from '../../components/Logo';
import { CardSpotlight } from '../../components/ui/card-spotlight';

// Step component for CardSpotlight
const Step = ({ title }: { title: string }) => {
  return (
    <li className="flex gap-2 items-start mb-2">
      <Check className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
      <p className="text-white">{title}</p>
    </li>
  );
};

// Value card component
const ValueCard = ({ icon, title, description }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      className="bg-white rounded-xl shadow-md p-6 border border-gray-100"
    >
      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </motion.div>
  );
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1"
            >
              <div className="flex items-center mb-6">
                <Logo size={48} />
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 ml-3">Vitraya Health</h1>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-blue-600 mb-6">
                Your Partner in Holistic Wellness
              </h2>
              <p className="text-lg text-gray-700 mb-8">
                At Vitraya Health, we&apos;re committed to making personalized healthcare accessible, 
                engaging, and effective. Our innovative platform combines cutting-edge technology 
                with evidence-based health practices to empower you on your wellness journey.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-500 to-blue-600">
                  <Link href="/dashboard">
                    Explore Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/health-quiz">
                    Take Health Quiz
                  </Link>
                </Button>
              </div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex-1"
            >
              <CardSpotlight className="p-8 w-full max-w-md mx-auto bg-gradient-to-br from-blue-900 to-blue-950">
                <div className="relative z-20">
                  <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
                  <p className="text-blue-100 mb-6">
                    To revolutionize personal healthcare through technology that empowers 
                    individuals to take control of their wellbeing with personalized insights, 
                    actionable recommendations, and supportive guidance.
                  </p>
                  <ul className="space-y-2">
                    <Step title="Personalized health assessments and recommendations" />
                    <Step title="AI-powered coaching available 24/7" />
                    <Step title="Comprehensive health tracking and insights" />
                    <Step title="Evidence-based wellness strategies" />
                  </ul>
                </div>
              </CardSpotlight>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-16 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto">
              These principles guide everything we do at Vitraya Health, from product development 
              to customer support.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <ValueCard 
              icon={<Heart className="h-6 w-6 text-blue-600" />}
              title="User-Centered Care"
              description="We design every feature with our users' needs, preferences, and goals at the forefront."
            />
            <ValueCard 
              icon={<Shield className="h-6 w-6 text-blue-600" />}
              title="Privacy & Security"
              description="Your health data is sensitive. We employ robust security measures to keep your information safe."
            />
            <ValueCard 
              icon={<Award className="h-6 w-6 text-blue-600" />}
              title="Evidence-Based Approach"
              description="Our recommendations are grounded in scientific research and clinical best practices."
            />
            <ValueCard 
              icon={<Clock className="h-6 w-6 text-blue-600" />}
              title="Continuous Improvement"
              description="We're committed to constantly enhancing our platform based on user feedback and new research."
            />
            <ValueCard 
              icon={<Zap className="h-6 w-6 text-blue-600" />}
              title="Innovation"
              description="We embrace cutting-edge technologies to provide novel solutions to health challenges."
            />
            <ValueCard 
              icon={<Check className="h-6 w-6 text-blue-600" />}
              title="Accessibility"
              description="We strive to make quality healthcare guidance available to everyone, regardless of location or background."
            />
          </div>
        </div>
      </section>

      {/* Our Approach Section */}
      <section className="py-16 px-4 md:px-8 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <CardSpotlight className="p-8 w-full bg-gradient-to-br from-indigo-900 to-indigo-950">
                <div className="relative z-20">
                  <h3 className="text-2xl font-bold text-white mb-4">The Vitraya Approach</h3>
                  <p className="text-indigo-100 mb-6">
                    Our holistic health philosophy combines traditional wisdom with modern science 
                    to address all aspects of wellbeing:
                  </p>
                  <ul className="space-y-3">
                    <Step title="Physical: Nutrition, exercise, and sleep optimization" />
                    <Step title="Mental: Stress management and cognitive health" />
                    <Step title="Social: Supporting meaningful connections" />
                    <Step title="Environmental: Creating healthy surroundings" />
                  </ul>
                </div>
              </CardSpotlight>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="flex-1"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                How We're Different
              </h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Personalized Health AI</h3>
                    <p className="text-gray-600">Our AI coach learns your health patterns and provides truly personalized guidance.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Comprehensive Health Metrics</h3>
                    <p className="text-gray-600">We track and analyze multiple health indicators for a complete picture of your wellbeing.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Engaging Experience</h3>
                    <p className="text-gray-600">Our beautiful interface and interactive features make health management enjoyable.</p>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Ongoing Support</h3>
                    <p className="text-gray-600">We provide continuous guidance and motivation to help you achieve lasting health improvements.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Transform Your Health Journey Today
            </h2>
            <p className="text-xl text-blue-100 mb-6 max-w-2xl mx-auto">
              Join over 10,000 users who have improved their health metrics, 
              achieved their wellness goals, and gained confidence in their daily habits.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">Personalized Health Tracking</span>
                </div>
                <p className="text-blue-100 text-sm ml-11">Monitor your progress with customized metrics tailored to your unique goals.</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-left">
                <div className="flex items-center mb-2">
                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                    <Check className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="font-medium">24/7 AI Health Coach</span>
                </div>
                <p className="text-blue-100 text-sm ml-11">Get immediate answers to your health questions and daily guidance whenever you need it.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <Button asChild size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-6 text-lg font-medium">
                <Link href="/dashboard">
                  Start Your Health Dashboard <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-indigo-500 text-white hover:bg-indigo-600 px-8 py-6 text-lg font-medium border-0">
                <Link href="/agent">
                  Talk to Your AI Health Coach
                </Link>
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-6">No credit card required. Start your wellness journey in less than 2 minutes.</p>
          </motion.div>
        </div>
      </section>
    </div>
  );
} 