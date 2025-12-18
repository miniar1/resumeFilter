// ==================== controllers/PostController.js ====================
import { Post } from "../models/PostModel.js";
import { cvScreeningService } from "../services/CVScreeningService.js";

// ==================== CRÉER UN POST ====================
export const createPost = async (request, reply) => {
  try {
    const {
      jobTitle,
      jobDescription,
      Degree,
      Major,
      Skills,
      SoftSkills,
      Exp_Year,
      extractedText,
      info
    } = request.body;

    // Validation
    if (!jobTitle || !jobDescription) {
      return reply.status(400).send({
        success: false,
        error: "jobTitle and jobDescription are required"
      });
    }

    // Créer le nouveau Post
    const newPost = new Post({
      jobTitle,
      jobDescription,
      Degree: Degree || '',
      Major: Major || '',
      Skills: Array.isArray(Skills) ? Skills : [],
      SoftSkills: Array.isArray(SoftSkills) ? SoftSkills : [],
      Exp_Year: parseInt(Exp_Year) || 0,
      extractedText: extractedText || '',
      info: info || {}
    });

    await newPost.save();

    request.log.info(`✅ Post created: ${newPost.jobTitle} (ID: ${newPost._id})`);

    return reply.code(201).send({
      success: true,
      message: "Post created successfully",
      post: newPost
    });
  } catch (err) {
    request.log.error("Error creating post:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to create post",
      details: err.message
    });
  }
};

// ==================== RÉCUPÉRER TOUS LES POSTS ====================
export const getAllPosts = async (request, reply) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });

    return reply.code(200).send({
      success: true,
      count: posts.length,
      posts
    });
  } catch (err) {
    request.log.error("Error fetching posts:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch posts",
      details: err.message
    });
  }
};

// ==================== RÉCUPÉRER UN POST PAR ID ====================
export const getPostById = async (request, reply) => {
  try {
    const { id } = request.params;

    const post = await Post.findById(id);

    if (!post) {
      return reply.status(404).send({
        success: false,
        error: "Post not found"
      });
    }

    return reply.code(200).send({
      success: true,
      post
    });
  } catch (err) {
    request.log.error("Error fetching post:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch post",
      details: err.message
    });
  }
};

// ==================== METTRE À JOUR UN POST ====================
export const updatePost = async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    const updatedPost = await Post.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      return reply.status(404).send({
        success: false,
        error: "Post not found"
      });
    }

    request.log.info(`✅ Post updated: ${updatedPost.jobTitle} (ID: ${id})`);

    return reply.code(200).send({
      success: true,
      message: "Post updated successfully",
      post: updatedPost
    });
  } catch (err) {
    request.log.error("Error updating post:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to update post",
      details: err.message
    });
  }
};

// ==================== SUPPRIMER UN POST ====================
export const deletePost = async (request, reply) => {
  try {
    const { id } = request.params;

    const deletedPost = await Post.findByIdAndDelete(id);

    if (!deletedPost) {
      return reply.status(404).send({
        success: false,
        error: "Post not found"
      });
    }

    request.log.info(`🗑️ Post deleted: ${deletedPost.jobTitle} (ID: ${id})`);

    return reply.code(200).send({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (err) {
    request.log.error("Error deleting post:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to delete post",
      details: err.message
    });
  }
};

// ==================== SCREENING DE CV AVEC IA ====================
export const screenResumes = async (request, reply) => {
  try {
    const { id } = request.params;

    request.log.info(`\n🎯 Screening request for job ID: ${id}`);

    // 1. Récupérer le job depuis la base de données
    const job = await Post.findById(id);

    if (!job) {
      return reply.status(404).send({
        success: false,
        error: "Job not found"
      });
    }

    request.log.info(`📋 Job found: ${job.jobTitle}`);

    // 2. Récupérer les fichiers uploadés et les paramètres (attachFieldsToBody: true mode)
    const files = [];
    let nb_postes = 3;
    let min_score = 0.3;

    request.log.info(`📦 Body keys: ${Object.keys(request.body || {})}`);

    // Avec attachFieldsToBody: true, les fichiers sont dans request.body.files
    const bodyFiles = request.body?.files;

    if (bodyFiles) {
      // Peut être un seul fichier ou un tableau de fichiers
      const fileArray = Array.isArray(bodyFiles) ? bodyFiles : [bodyFiles];

      for (const file of fileArray) {
        if (file && file.filename) {
          files.push(file);
          request.log.info(`📄 File received: ${file.filename}`);
        }
      }
    }

    // Récupérer les paramètres
    if (request.body?.nb_postes) {
      nb_postes = parseInt(request.body.nb_postes.value || request.body.nb_postes) || 3;
    }
    if (request.body?.min_score) {
      min_score = parseFloat(request.body.min_score.value || request.body.min_score) || 0.3;
    }

    if (files.length === 0) {
      request.log.info(`❌ No files found in body`);
      return reply.status(400).send({
        success: false,
        error: "No resume files uploaded"
      });
    }

    request.log.info(`📂 ${files.length} files received`);
    request.log.info(`🎯 Screening params: nb_postes=${nb_postes}, min_score=${min_score}`);

    // 3. Lancer le screening avec le service Python
    const screeningResult = await cvScreeningService.screenResumes(
      job,
      files,
      {
        nb_postes,
        min_score,
        cleanup: false // Garder les fichiers pour référence
      }
    );

    // 5. Mettre à jour le job avec les résultats
    job.info = {
      ...job.info,
      lastScreening: new Date(),
      candidatesScreened: files.length,
      candidatesSelected: screeningResult.results.length,
      topCandidates: screeningResult.results,
      screeningParams: {
        nb_postes,
        min_score
      }
    };

    await job.save();

    request.log.info(`✅ Screening completed and saved to database`);

    // 6. Retourner les résultats
    return reply.code(200).send({
      success: true,
      message: "Screening completed successfully",
      job: {
        id: job._id,
        title: job.jobTitle
      },
      results: screeningResult.results,
      metadata: screeningResult.metadata
    });

  } catch (err) {
    request.log.error("❌ Error screening resumes:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to screen resumes",
      details: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
};

// ==================== RÉCUPÉRER LES RÉSULTATS D'UN SCREENING ====================
export const getScreeningResults = async (request, reply) => {
  try {
    const { id } = request.params;

    const post = await Post.findById(id);

    if (!post) {
      return reply.status(404).send({
        success: false,
        error: "Post not found"
      });
    }

    if (!post.info?.topCandidates) {
      return reply.status(404).send({
        success: false,
        error: "No screening results found for this job"
      });
    }

    return reply.code(200).send({
      success: true,
      job: {
        id: post._id,
        title: post.jobTitle,
        lastScreening: post.info.lastScreening
      },
      results: post.info.topCandidates,
      stats: {
        totalScreened: post.info.candidatesScreened,
        totalSelected: post.info.candidatesSelected,
        params: post.info.screeningParams
      }
    });
  } catch (err) {
    request.log.error("Error fetching screening results:", err);
    return reply.code(500).send({
      success: false,
      error: "Failed to fetch screening results",
      details: err.message
    });
  }
};