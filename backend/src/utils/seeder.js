const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

/**
 * Seeds the database with default demo profiles and doctor directories if empty
 */
const seedDatabase = async () => {
  try {
    // Demo Doctors List
    const doctorsList = [
      {
        email: 'doctor@healthhub.com', // Primary Demo Doctor
        name: 'Dr. Sarah Wilson',
        phone: '+1 (555) 019-2831',
        specialization: 'Cardiology',
        qualification: 'MD, FACC (Harvard Medical)',
        experience: 12,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/32.jpg',
      },
      {
        email: 'james.brown@healthhub.com',
        name: 'Dr. James Brown',
        phone: '+1 (555) 019-8811',
        specialization: 'Neurology',
        qualification: 'MD, PhD (Johns Hopkins)',
        experience: 8,
        workingDays: [1, 2, 3, 4],
        workingHours: { start: '10:00', end: '16:00' },
        profilePhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'emily.davis@healthhub.com',
        name: 'Dr. Emily Davis',
        phone: '+1 (555) 019-3322',
        specialization: 'Dermatology',
        qualification: 'MD (Stanford Residency)',
        experience: 10,
        workingDays: [2, 3, 4, 5],
        workingHours: { start: '09:00', end: '15:30' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/79.jpg',
      },
      {
        email: 'michael.johnson@healthhub.com',
        name: 'Dr. Michael Johnson',
        phone: '+1 (555) 019-4455',
        specialization: 'General Medicine',
        qualification: 'MD, FACP (Yale Medicine)',
        experience: 15,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '08:30', end: '17:30' },
        profilePhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'sophia.lee@healthhub.com',
        name: 'Dr. Sophia Lee',
        phone: '+1 (555) 019-5566',
        specialization: 'Pediatrics',
        qualification: 'MD, FAAP (Penn Medicine)',
        experience: 7,
        workingDays: [1, 2, 3, 5],
        workingHours: { start: '09:00', end: '16:30' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/52.jpg',
      },
      {
        email: 'david.miller@healthhub.com',
        name: 'Dr. David Miller',
        phone: '+1 (555) 019-7788',
        specialization: 'Orthopedics',
        qualification: 'MD (UCSF Fellowship)',
        experience: 11,
        workingDays: [1, 3, 5],
        workingHours: { start: '09:00', end: '15:00' },
        profilePhoto: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'olivia.taylor@healthhub.com',
        name: 'Dr. Olivia Taylor',
        phone: '+1 (555) 019-1234',
        specialization: 'Psychiatry',
        qualification: 'MD (Columbia University)',
        experience: 9,
        workingDays: [1, 2, 4, 5],
        workingHours: { start: '09:30', end: '17:00' },
        profilePhoto: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'daniel.harris@healthhub.com',
        name: 'Dr. Daniel Harris',
        phone: '+1 (555) 019-5678',
        specialization: 'Gynecology',
        qualification: 'MD, FACOG (University of Chicago)',
        experience: 14,
        workingDays: [1, 2, 3, 4],
        workingHours: { start: '08:00', end: '16:00' },
        profilePhoto: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'matthew.clark@healthhub.com',
        name: 'Dr. Matthew Clark',
        phone: '+1 (555) 019-9012',
        specialization: 'Dentistry',
        qualification: 'DDS (NYU College of Dentistry)',
        experience: 6,
        workingDays: [1, 2, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/68.jpg',
      },
      {
        email: 'elizabeth.lewis@healthhub.com',
        name: 'Dr. Elizabeth Lewis',
        phone: '+1 (555) 019-3456',
        specialization: 'ENT',
        qualification: 'MD (Michigan Medicine)',
        experience: 13,
        workingDays: [2, 3, 5],
        workingHours: { start: '09:00', end: '17:00' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/90.jpg',
      },
      {
        email: 'christopher.robinson@healthhub.com',
        name: 'Dr. Christopher Robinson',
        phone: '+1 (555) 019-7890',
        specialization: 'Cardiology',
        qualification: 'MD (Duke University Residency)',
        experience: 16,
        workingDays: [1, 2, 3, 5],
        workingHours: { start: '09:00', end: '16:00' },
        profilePhoto: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300',
      },
      {
        email: 'isabella.walker@healthhub.com',
        name: 'Dr. Isabella Walker',
        phone: '+1 (555) 019-2143',
        specialization: 'General Medicine',
        qualification: 'MD (Northwestern University)',
        experience: 5,
        workingDays: [1, 2, 3, 4, 5],
        workingHours: { start: '09:00', end: '17:00' },
        profilePhoto: 'https://randomuser.me/api/portraits/women/65.jpg',
      }
    ];

    console.log('[Seeder] Starting database seeding for HealthHub AI...');

    // 1. Ensure Admin account
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      await User.create({
        email: 'admin@healthhub.com',
        password: 'HealthHub123',
        role: 'admin',
      });
      console.log('[Seeder] Admin account seeded: admin@healthhub.com');
    } else {
      adminUser.password = 'HealthHub123';
      await adminUser.save();
      console.log('[Seeder] Admin account password reset to HealthHub123');
    }

    // 2. Ensure Demo Patient account exists and password is correct
    const patientUser = await User.findOne({ email: 'patient@healthhub.com' });
    if (!patientUser) {
      const user = await User.create({
        email: 'patient@healthhub.com',
        password: 'HealthHub123',
        role: 'patient',
      });
      await Patient.create({
        userId: user._id,
        name: 'Alex Mercer',
        phone: '+1 (555) 019-9988',
        gender: 'male',
        dateOfBirth: new Date('1994-04-12'),
        medicalHistory: 'Diagnosed with mild seasonal asthma in 2021. Penicillin allergy.',
      });
      console.log('[Seeder] Demo Patient seeded: patient@healthhub.com');
    } else {
      patientUser.password = 'HealthHub123';
      await patientUser.save();
      console.log('[Seeder] Patient account password reset to HealthHub123');
    }

    // 3. Check doctors and create/update as needed
    const docCount = await Doctor.countDocuments();
    if (docCount === 0) {
      // Seed all new doctors
      for (const doc of doctorsList) {
        // Create user authentication record (using HealthHub123 password)
        const user = await User.create({
          email: doc.email,
          password: 'HealthHub123',
          role: 'doctor',
        });

        // Create profile record
        await Doctor.create({
          userId: user._id,
          name: doc.name,
          phone: doc.phone,
          specialization: doc.specialization,
          qualification: doc.qualification,
          experience: doc.experience,
          workingDays: doc.workingDays,
          workingHours: doc.workingHours,
          slotDuration: 30,
          maxPatientsPerDay: 15,
          profilePhoto: doc.profilePhoto,
          isActive: true,
        });
        console.log(`[Seeder] Seeded Doctor: ${doc.email}`);
      }
      console.log('[Seeder] All demo doctors successfully seeded.');
    } else {
      // Ensure all existing demo doctors have password HealthHub123!
      for (const doc of doctorsList) {
        const doctorUser = await User.findOne({ email: doc.email });
        if (doctorUser) {
          doctorUser.password = 'HealthHub123';
          await doctorUser.save();
          console.log(`[Seeder] Doctor ${doc.email} password reset to HealthHub123`);
        }
      }
      console.log('[Seeder] Doctor records already present. Updated passwords to HealthHub123');
    }
  } catch (error) {
    console.error('[Seeder Error] Failed database seeding:', error.message);
  }
};

module.exports = {
  seedDatabase,
};
