/*import resumeService from "../services/resumeService.js";

const analyzeResume = async (req, reply) => {
  try {
    const data = await resumeService.processResume(req);
    return reply.send({ success: true, results: data });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ success: false, error: err.message });
  }
};

export default { analyzeResume };*/