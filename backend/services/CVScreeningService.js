// ==================== services/cvScreeningService.js ====================
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Service pour gérer le screening de CV avec Python
 */
class CVScreeningService {
  constructor() {
    this.pythonScriptPath = path.join(__dirname, '../AI/ai3.py');
    this.tempDir = path.join(__dirname, '../temp');
    this.uploadsDir = path.join(__dirname, '../uploads/resumes');

    // Créer les dossiers s'ils n'existent pas
    this.ensureDirectories();
  }

  ensureDirectories() {
    [this.tempDir, this.uploadsDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Formate la description du job pour l'IA
   */
  formatJobDescription(job) {
    let description = `${job.jobDescription}\n\n`;

    if (job.Degree) {
      description += `Required Degree: ${job.Degree}\n`;
    }

    if (job.Major) {
      description += `Preferred Major: ${job.Major}\n`;
    }

    if (job.Skills && job.Skills.length > 0) {
      description += `Technical Skills Required: ${job.Skills.join(', ')}\n`;
    }

    if (job.SoftSkills && job.SoftSkills.length > 0) {
      description += `Soft Skills Desired: ${job.SoftSkills.join(', ')}\n`;
    }

    if (job.Exp_Year) {
      description += `Minimum Experience: ${job.Exp_Year} year(s)\n`;
    }

    return description;
  }

  /**
   * Sauvegarde les fichiers uploadés depuis Fastify multipart
   */
  async saveUploadedFiles(files) {
    const savedPaths = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}_${file.filename}`;
        const filePath = path.join(this.uploadsDir, fileName);

        // Lire le buffer du fichier
        const buffer = await file.toBuffer();

        // Sauvegarder le fichier
        fs.writeFileSync(filePath, buffer);

        savedPaths.push({
          originalName: file.filename,
          savedPath: filePath,
          size: buffer.length
        });

      } catch (error) {
        console.error(`Error saving file ${file.filename}:`, error);
      }
    }

    return savedPaths;
  }

  /**
   * Exécute le script Python de screening
   */
  async runPythonScreening(jobData, resumePaths) {
    return new Promise((resolve, reject) => {
      // Créer un fichier JSON temporaire avec les données
      const tempDataFile = path.join(
        this.tempDir,
        `job_data_${Date.now()}.json`
      );

      const dataToSend = {
        job: {
          category: jobData.jobTitle,
          description: this.formatJobDescription(jobData),
          nb_postes: jobData.nb_postes || 3,
          min_score: jobData.min_score || 0.3,
          degree: jobData.Degree,
          major: jobData.Major,
          skills: jobData.Skills || [],
          softSkills: jobData.SoftSkills || [],
          experience: jobData.Exp_Year || 0
        },
        resume_paths: resumePaths
      };

      // Sauvegarder les données dans le fichier temporaire
      fs.writeFileSync(tempDataFile, JSON.stringify(dataToSend, null, 2));

      console.log('📄 Temp data file created:', tempDataFile);
      console.log('🐍 Launching Python script...');

      // Lancer le script Python
      const pythonProcess = spawn('python', [
        this.pythonScriptPath,
        tempDataFile
      ]);

      let dataString = '';
      let errorString = '';

      pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('Python output:', output);
        dataString += output;
      });

      pythonProcess.stderr.on('data', (data) => {
        const error = data.toString();
        console.error('Python error:', error);
        errorString += error;
      });

      pythonProcess.on('close', (code) => {
        // Nettoyer le fichier temporaire
        try {
          fs.unlinkSync(tempDataFile);
        } catch (err) {
          console.error('Error deleting temp file:', err);
        }

        if (code !== 0) {
          reject(new Error(
            `Python script exited with code ${code}: ${errorString}`
          ));
          return;
        }

        try {
          // Parser les résultats JSON
          const results = JSON.parse(dataString);
          console.log('✅ Python screening completed');
          resolve(results);
        } catch (error) {
          reject(new Error(
            `Failed to parse Python output: ${error.message}\nOutput: ${dataString}`
          ));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  /**
   * Nettoie les fichiers uploadés (optionnel)
   */
  cleanupFiles(filePaths) {
    filePaths.forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log('🗑️ Cleaned up:', filePath);
        }
      } catch (error) {
        console.error(`Error deleting file ${filePath}:`, error);
      }
    });
  }

  /**
   * Méthode principale pour screener les CV
   */
  async screenResumes(job, files, options = {}) {
    try {
      console.log('\n🎯 Starting CV screening process...');
      console.log(`Job: ${job.jobTitle}`);
      console.log(`Files to process: ${files.length}`);

      // 1. Sauvegarder les fichiers uploadés
      const savedFiles = await this.saveUploadedFiles(files);
      const resumePaths = savedFiles.map(f => f.savedPath);

      console.log(`✅ ${savedFiles.length} files saved`);

      // 2. Préparer les données pour Python
      const jobData = {
        ...job,
        nb_postes: options.nb_postes || 3,
        min_score: options.min_score || 0.3
      };

      // 3. Exécuter le script Python
      const results = await this.runPythonScreening(jobData, resumePaths);

      // 4. Enrichir les résultats avec les métadonnées
      const enrichedResults = results.map(result => ({
        ...result,
        originalFileName: savedFiles[result.candidate_id - 1]?.originalName,
        fileSize: savedFiles[result.candidate_id - 1]?.size,
        processedAt: new Date().toISOString()
      }));

      // 5. Optionnel: Nettoyer les fichiers
      if (options.cleanup) {
        this.cleanupFiles(resumePaths);
      }

      console.log(`✅ Screening completed: ${enrichedResults.length} candidates selected\n`);

      return {
        success: true,
        results: enrichedResults,
        metadata: {
          totalProcessed: files.length,
          totalSelected: enrichedResults.length,
          job: job.jobTitle,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      console.error('❌ Screening error:', error);
      throw error;
    }
  }
}

// Exporter une instance unique (singleton)
export const cvScreeningService = new CVScreeningService();
export default cvScreeningService;