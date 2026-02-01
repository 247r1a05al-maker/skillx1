const mongoose = require('mongoose');
const User = require('../models/User');
const Skill = require('../models/Skill');
const ExchangeRequest = require('../models/ExchangeRequest');

const seedData = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Skill.deleteMany({});
    await ExchangeRequest.deleteMany({});
    console.log('✓ Cleared existing data');

    // Create demo users with diverse skills
    const demoUsers = [
      {
        name: 'Alex Chen',
        email: 'alex@example.com',
        bio: 'Full-stack developer passionate about React and Node.js. Love teaching beginners!',
        avatar: 'https://i.pravatar.cc/150?img=1',
        skills: ['React', 'Node.js', 'JavaScript', 'MongoDB'],
        learningGoals: ['Machine Learning', 'DevOps', 'AWS'],
        location: 'San Francisco, CA',
        experience: 'intermediate',
        exchangeRate: 1,
        coins: 500,
        isOnline: true,
        completedExchanges: 12,
        rating: 4.8,
      },
      {
        name: 'Sarah Williams',
        email: 'sarah@example.com',
        bio: 'UI/UX Designer with 5+ years experience. Expert in Figma and Design Systems.',
        avatar: 'https://i.pravatar.cc/150?img=2',
        skills: ['UI Design', 'UX Research', 'Figma', 'Design Systems'],
        learningGoals: ['Frontend Development', 'Web Design', 'Animation'],
        location: 'New York, NY',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 750,
        isOnline: true,
        completedExchanges: 28,
        rating: 4.9,
      },
      {
        name: 'Raj Patel',
        email: 'raj@example.com',
        bio: 'Data scientist specializing in Python and Machine Learning. Open to mentoring!',
        avatar: 'https://i.pravatar.cc/150?img=3',
        skills: ['Python', 'Machine Learning', 'Data Analysis', 'SQL'],
        learningGoals: ['Web Development', 'Cloud Architecture', 'Deep Learning'],
        location: 'Boston, MA',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 600,
        isOnline: false,
        completedExchanges: 18,
        rating: 4.7,
      },
      {
        name: 'Emma Johnson',
        email: 'emma@example.com',
        bio: 'DevOps engineer with Kubernetes and Docker expertise. Coffee enthusiast ☕',
        avatar: 'https://i.pravatar.cc/150?img=4',
        skills: ['Kubernetes', 'Docker', 'AWS', 'CI/CD'],
        learningGoals: ['Terraform', 'Golang', 'System Design'],
        location: 'Seattle, WA',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 850,
        isOnline: true,
        completedExchanges: 35,
        rating: 4.9,
      },
      {
        name: 'Marcus Lee',
        email: 'marcus@example.com',
        bio: 'Mobile app developer. Expert in React Native and Flutter. Always learning!',
        avatar: 'https://i.pravatar.cc/150?img=5',
        skills: ['React Native', 'Flutter', 'iOS Development', 'Mobile Design'],
        learningGoals: ['Backend Development', 'DevOps', 'System Architecture'],
        location: 'Los Angeles, CA',
        experience: 'intermediate',
        exchangeRate: 1,
        coins: 400,
        isOnline: true,
        completedExchanges: 9,
        rating: 4.6,
      },
      {
        name: 'Jessica Brown',
        email: 'jessica@example.com',
        bio: 'QA Engineer passionate about automation testing. Bug hunter 🐛',
        avatar: 'https://i.pravatar.cc/150?img=6',
        skills: ['Test Automation', 'Selenium', 'Cypress', 'Performance Testing'],
        learningGoals: ['Backend Development', 'API Testing', 'Load Testing'],
        location: 'Austin, TX',
        experience: 'intermediate',
        exchangeRate: 1,
        coins: 320,
        isOnline: true,
        completedExchanges: 14,
        rating: 4.8,
      },
      {
        name: 'David Kim',
        email: 'david@example.com',
        bio: 'Cloud architect specializing in Azure and multi-cloud strategies.',
        avatar: 'https://i.pravatar.cc/150?img=7',
        skills: ['Azure', 'AWS', 'GCP', 'Cloud Architecture', 'Terraform'],
        learningGoals: ['Kubernetes', 'Golang', 'AI/ML'],
        location: 'Chicago, IL',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 920,
        isOnline: true,
        completedExchanges: 42,
        rating: 5.0,
      },
      {
        name: 'Lisa Garcia',
        email: 'lisa@example.com',
        bio: 'Product manager with growth hacking expertise. Data-driven decisions!',
        avatar: 'https://i.pravatar.cc/150?img=8',
        skills: ['Product Management', 'Analytics', 'Growth Strategy', 'User Research'],
        learningGoals: ['Technical Skills', 'Data Science', 'Startups'],
        location: 'Miami, FL',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 680,
        isOnline: false,
        completedExchanges: 22,
        rating: 4.7,
      },
      {
        name: 'James Wilson',
        email: 'james@example.com',
        bio: 'Security engineer focused on cybersecurity and ethical hacking.',
        avatar: 'https://i.pravatar.cc/150?img=9',
        skills: ['Cybersecurity', 'Ethical Hacking', 'Network Security', 'Penetration Testing'],
        learningGoals: ['Cloud Security', 'Zero Trust Architecture', 'Compliance'],
        location: 'Denver, CO',
        experience: 'advanced',
        exchangeRate: 1,
        coins: 780,
        isOnline: true,
        completedExchanges: 26,
        rating: 4.8,
      },
      {
        name: 'Sofia Martinez',
        email: 'sofia@example.com',
        bio: 'GraphQL and API design specialist. Building the future of web APIs!',
        avatar: 'https://i.pravatar.cc/150?img=10',
        skills: ['GraphQL', 'REST APIs', 'API Design', 'Node.js', 'PostgreSQL'],
        learningGoals: ['Microservices', 'gRPC', 'Event-Driven Architecture'],
        location: 'Portland, OR',
        experience: 'intermediate',
        exchangeRate: 1,
        coins: 550,
        isOnline: true,
        completedExchanges: 16,
        rating: 4.7,
      },
    ];

    const createdUsers = await User.insertMany(demoUsers);
    console.log(`✓ Created ${createdUsers.length} demo users`);

    // Create skill entries
    const allSkills = [
      'React', 'Node.js', 'JavaScript', 'MongoDB', 'Machine Learning', 'DevOps', 'AWS',
      'UI Design', 'UX Research', 'Figma', 'Design Systems', 'Python', 'Data Analysis', 'SQL',
      'Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'Golang', 'React Native', 'Flutter',
      'iOS Development', 'Mobile Design', 'Test Automation', 'Selenium', 'Cypress',
      'Azure', 'GCP', 'Cloud Architecture', 'Product Management', 'Analytics', 'Growth Strategy',
      'Cybersecurity', 'Ethical Hacking', 'Network Security', 'GraphQL', 'REST APIs', 'PostgreSQL',
      'TypeScript', 'Vue.js', 'Angular', 'CSS', 'HTML', 'Webpack', 'Redux', 'Express.js',
      'Django', 'FastAPI', 'Java', 'Spring Boot', 'C++', 'Rust', 'Go', 'Ruby on Rails',
    ];

    const skillObjects = allSkills.map(skill => ({
      name: skill,
      category: getCategoryForSkill(skill),
      difficulty: getRandomDifficulty(),
      demand: 'High',
    }));

    const createdSkills = await Skill.insertMany(skillObjects);
    console.log(`✓ Created ${createdSkills.length} skills`);

    // Create some sample exchange requests
    const exchangeRequests = [
      {
        requestor: createdUsers[0]._id,
        recipient: createdUsers[1]._id,
        skillOffered: 'React',
        skillRequested: 'UI Design',
        status: 'completed',
        sessionDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        feedback: { rating: 5, comment: 'Great teaching skills! Very patient.' },
      },
      {
        requestor: createdUsers[2]._id,
        recipient: createdUsers[0]._id,
        skillOffered: 'Machine Learning',
        skillRequested: 'React',
        status: 'pending',
        sessionDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      },
      {
        requestor: createdUsers[4]._id,
        recipient: createdUsers[3]._id,
        skillOffered: 'React Native',
        skillRequested: 'DevOps',
        status: 'completed',
        sessionDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        feedback: { rating: 4, comment: 'Helpful and professional' },
      },
    ];

    const createdRequests = await ExchangeRequest.insertMany(exchangeRequests);
    console.log(`✓ Created ${createdRequests.length} exchange requests`);

    console.log('✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

function getCategoryForSkill(skill) {
  const categories = {
    'Frontend': ['React', 'Vue.js', 'Angular', 'CSS', 'HTML', 'TypeScript', 'Webpack'],
    'Backend': ['Node.js', 'Django', 'FastAPI', 'Express.js', 'Java', 'Spring Boot', 'PostgreSQL'],
    'DevOps': ['Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'Terraform', 'CI/CD'],
    'Data': ['Python', 'Machine Learning', 'Data Analysis', 'SQL', 'Analytics'],
    'Mobile': ['React Native', 'Flutter', 'iOS Development', 'Mobile Design'],
    'Design': ['UI Design', 'UX Research', 'Figma', 'Design Systems'],
    'Security': ['Cybersecurity', 'Ethical Hacking', 'Network Security'],
  };

  for (const [category, skills] of Object.entries(categories)) {
    if (skills.includes(skill)) return category;
  }
  return 'Other';
}

function getRandomDifficulty() {
  const difficulties = ['Beginner', 'Intermediate', 'Advanced'];
  return difficulties[Math.floor(Math.random() * difficulties.length)];
}

// Run if directly executed
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skill-exchange')
    .then(() => seedData())
    .catch(err => {
      console.error('Database connection failed:', err);
      process.exit(1);
    });
}

module.exports = seedData;
