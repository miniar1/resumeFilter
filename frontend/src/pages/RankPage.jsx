import{ useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar/Navbar';
import FileIcon from '../images/fileIcon.png';
import FileUpload from '../components/Screener/FileUpload';
import ResumeResultsTable from '../components/Rank/ResumeRankTable';

// API Configuration
// eslint-disable-next-line no-undef
const API_URL = 'http://localhost:5001/api';

// Configure axios defaults
axios.defaults.baseURL = API_URL;
axios.defaults.headers.common['Content-Type'] = 'application/json';

export default function RankPage() {
    const [jobTitle, setJobTitle] = useState('');
    const [jobDescription, setJobDescription] = useState('');
    const [degree, setDegree] = useState('');
    const [major, setMajor] = useState('');
    const [skills, setSkills] = useState([]);
    const [softskills, setSoftSkills] = useState([]);
    const [experience, setExperience] = useState('');
    const [skillInput, setSkillInput] = useState('');
    const [softskillsInput, setSoftSkillsInput] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [savedJobs, setSavedJobs] = useState([]);
    const [selectedJobId, setSelectedJobId] = useState('');
    const [nbPostes, setNbPostes] = useState(3);

    useEffect(() => {
        fetchSavedJobs();
    }, []);

    const fetchSavedJobs = async () => {
        try {
            console.log('Fetching jobs from:', `${API_URL}/posts`);
            const response = await axios.get('/posts');
            console.log('Jobs loaded:', response.data);
            setSavedJobs(response.data.posts || []);
        } catch (error) {
            console.error('Error fetching saved jobs:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
            }
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files.filter(file => file.type === 'application/pdf'));
    };

    const handleSkillAdd = () => {
        if (skillInput.trim() && !skills.includes(skillInput.trim())) {
            setSkills([...skills, skillInput.trim()]);
            setSkillInput('');
        }
    };

    const handleSkillRemove = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleSoftSkillAdd = () => {
        if (softskillsInput.trim() && !softskills.includes(softskillsInput.trim())) {
            setSoftSkills([...softskills, softskillsInput.trim()]);
            setSoftSkillsInput('');
        }
    };

    const handleSoftSkillRemove = (skillToRemove) => {
        setSoftSkills(softskills.filter(skill => skill !== skillToRemove));
    };

    const handleJobSelect = async (jobId) => {
        if (!jobId) {
            resetForm();
            return;
        }
        
        try {
            const response = await axios.get(`/posts/${jobId}`);
            const job = response.data.post;
            
            setSelectedJobId(jobId);
            setJobTitle(job.jobTitle || '');
            setJobDescription(job.jobDescription || '');
            setDegree(job.Degree || '');
            setMajor(job.Major || '');
            setSkills(job.Skills || []);
            setSoftSkills(job.SoftSkills || []);
            setExperience(job.Exp_Year?.toString() || '');
        } catch (error) {
            console.error('Error loading job:', error);
            alert('Error loading job: ' + (error.response?.data?.error || error.message));
        }
    };

    const resetForm = () => {
        setSelectedJobId('');
        setJobTitle('');
        setJobDescription('');
        setDegree('');
        setMajor('');
        setSkills([]);
        setSoftSkills([]);
        setExperience('');
        setSelectedFiles([]);
        setResults([]);
    };

    const handleSaveJob = async () => {
        if (!jobTitle.trim() || !jobDescription.trim()) {
            alert('Job Title and Job Description are required!');
            return;
        }

        try {
            console.log('Saving job to:', `${API_URL}/posts`);
            
            const jobData = {
                jobTitle: jobTitle.trim(),
                jobDescription: jobDescription.trim(),
                Degree: degree,
                Major: major,
                Skills: skills,
                SoftSkills: softskills,
                Exp_Year: parseInt(experience) || 0
            };

            console.log('Job data:', jobData);

            const response = await axios.post('/posts', jobData);

            console.log('Response:', response.data);
            
            if (response.data.success) {
                alert('Job saved successfully!');
                setSelectedJobId(response.data.post._id);
                await fetchSavedJobs();
            }
        } catch (error) {
            console.error('Error saving job:', error);
            
            if (error.response) {
                console.error('Error response:', error.response.data);
                alert(`Error: ${error.response.data.error || 'Failed to save job'}`);
            } else if (error.request) {
                console.error('No response received:', error.request);
                alert('No response from server. Please check if the server is running.');
            } else {
                console.error('Error:', error.message);
                alert(`Error: ${error.message}`);
            }
        }
    };

    const handleSubmit = async () => {
        if (!selectedJobId) {
            alert('Please save the job first or select an existing job');
            return;
        }

        if (selectedFiles.length === 0) {
            alert('Please upload at least one resume');
            return;
        }

        const formData = new FormData();

        // Ajouter les fichiers
        selectedFiles.forEach((file) => {
            formData.append('files', file);
        });

        // Ajouter les paramètres
        formData.append('nb_postes', nbPostes);
        formData.append('min_score', '0.3');

        setLoading(true);
        try {
            const response = await axios.post(
                `/screen-resumes/${selectedJobId}`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            );

            console.log('Screening results:', response.data);
            setResults(response.data.results || []);
            alert('Screening completed successfully!');
        } catch (error) {
            console.error('Error screening resumes:', error);
            alert(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Navbar />
            <div className='screen-container min-h-screen p-4 bg-gray-100'>
                <div className='p-4 flex justify-center text-4xl mb-8 text-gray-800'>
                    Job Description & CV Screening
                </div>

                <div className="job-form bg-white shadow-lg text-gray-800 p-6 rounded-lg max-w-xl mx-auto">
                    
                    {/* Load existing job */}
                    <div className="mb-6">
                        <label className="block text-lg font-medium mb-2">
                            Load Existing Job
                        </label>
                        <select
                            className="w-full p-2 rounded border border-gray-300"
                            value={selectedJobId}
                            onChange={(e) => handleJobSelect(e.target.value)}
                        >
                            <option value="">-- Create New Job --</option>
                            {savedJobs.map((job) => (
                                <option key={job._id} value={job._id}>
                                    {job.jobTitle} ({new Date(job.createdAt).toLocaleDateString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Job Title */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">
                            Job Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            className="w-full p-2 rounded border border-gray-300"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            placeholder="e.g., Full Stack Developer"
                            required
                        />
                    </div>

                    {/* Job Description */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">
                            Job Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="w-full p-2 rounded border border-gray-300"
                            value={jobDescription}
                            onChange={(e) => setJobDescription(e.target.value)}
                            placeholder="Enter detailed job description"
                            rows="4"
                            required
                        />
                    </div>

                    <div className="flex gap-4">
                        {/* Degree */}
                        <div className="mb-4 flex-grow">
                            <label className="block text-lg font-medium mb-2">Degree</label>
                            <select
                                className="w-full p-2 rounded border border-gray-300"
                                value={degree}
                                onChange={(e) => setDegree(e.target.value)}
                            >
                                <option value="">Select Degree</option>
                                <option value="Bachelor">Bachelor</option>
                                <option value="Master">Master</option>
                                <option value="PhD">PhD</option>
                                <option value="None">None</option>
                            </select>
                        </div>
                        
                        {/* Major */}
                        <div className="mb-4 flex-grow">
                            <label className="block text-lg font-medium mb-2">Education</label>
                            <input
                                type="text"
                                className="w-full p-2 rounded border border-gray-300"
                                value={major}
                                onChange={(e) => setMajor(e.target.value)}
                                placeholder="e.g., Computer Engineering"
                            />
                        </div>
                    </div>

                    {/* Technical Skills */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">Technical Skills</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                className="w-full p-2 rounded border border-gray-300"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSkillAdd();
                                    }
                                }}
                                placeholder="Type a skill and press Enter"
                            />
                            <button
                                onClick={handleSkillAdd}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                type="button"
                            >
                                Add
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap">
                            {skills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-blue-100 text-blue-800 p-2 rounded mr-2 mb-2 flex items-center"
                                >
                                    {skill}
                                    <button
                                        onClick={() => handleSkillRemove(skill)}
                                        className="text-red-500 font-bold ml-2 hover:text-red-700"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Soft Skills */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">Soft Skills</label>
                        <div className="flex space-x-2">
                            <input
                                type="text"
                                className="w-full p-2 rounded border border-gray-300"
                                value={softskillsInput}
                                onChange={(e) => setSoftSkillsInput(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleSoftSkillAdd();
                                    }
                                }}
                                placeholder="Type a soft skill and press Enter"
                            />
                            <button
                                onClick={handleSoftSkillAdd}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                type="button"
                            >
                                Add
                            </button>
                        </div>
                        <div className="mt-2 flex flex-wrap">
                            {softskills.map((skill, index) => (
                                <span
                                    key={index}
                                    className="bg-green-100 text-green-800 p-2 rounded mr-2 mb-2 flex items-center"
                                >
                                    {skill}
                                    <button
                                        onClick={() => handleSoftSkillRemove(skill)}
                                        className="text-red-500 font-bold ml-2 hover:text-red-700"
                                        type="button"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Experience */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">
                            Experience (Years)
                        </label>
                        <input
                            type="number"
                            className="w-full p-2 rounded border border-gray-300"
                            value={experience}
                            onChange={(e) => setExperience(e.target.value)}
                            placeholder="Required years of experience"
                            min="0"
                        />
                    </div>

                    {/* Number of positions */}
                    <div className="mb-4">
                        <label className="block text-lg font-medium mb-2">
                            Number of Positions to Fill
                        </label>
                        <input
                            type="number"
                            className="w-full p-2 rounded border border-gray-300"
                            value={nbPostes}
                            onChange={(e) => setNbPostes(parseInt(e.target.value) || 1)}
                            min="1"
                            max="50"
                        />
                    </div>

                    {/* Save Job Button */}
                    <div className="flex justify-center mb-4">
                        <button
                            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
                            onClick={handleSaveJob}
                            disabled={!jobTitle.trim() || !jobDescription.trim()}
                            type="button"
                        >
                            {selectedJobId ? '💾 Update Job' : '💾 Save New Job'}
                        </button>
                    </div>

                    <div className='border-t-2 border-gray-300 my-6'></div>

                    {/* File Upload Section */}
                    <div className='bg-gradient-to-br from-blue-500 to-purple-600 h-48 w-full border-2 border-dotted border-white rounded-xl flex items-center justify-center'>
                        <div className='flex flex-col items-center space-y-3 p-4'>
                            <img src={FileIcon} alt="fileicon" className='w-20' />
                            <input
                                type="file"
                                id="fileUpload"
                                accept="application/pdf"
                                multiple
                                hidden
                                onChange={handleFileChange}
                            />
                            <label
                                htmlFor="fileUpload"
                                className='px-6 py-3 rounded-lg bg-white font-bold uppercase cursor-pointer hover:bg-gray-100 transition'
                            >
                                📄 Choose Resumes
                            </label>
                            <div className='text-white text-sm'>or drop PDF files here</div>
                        </div>
                    </div>

                    {selectedFiles.length > 0 && (
                        <div className='p-4 mt-4 bg-gray-50 rounded-lg'>
                            <h2 className='text-xl font-semibold mb-3 text-center'>
                                📂 Uploaded Files ({selectedFiles.length})
                            </h2>
                            <div className='max-h-60 overflow-y-auto space-y-2'>
                                {selectedFiles.map((file, index) => (
                                    <FileUpload key={index} file={file} />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Screen Button */}
                    <div className="flex justify-center mt-6">
                        <button
                            className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition transform hover:scale-105"
                            onClick={handleSubmit}
                            disabled={loading || !selectedJobId || selectedFiles.length === 0}
                            type="button"
                        >
                            {loading ? '⏳ Screening...' : '🔍 Screen Resumes'}
                        </button>
                    </div>
                </div>
            </div>
            
            {results && results.length > 0 && (
                <div className="mt-8">
                    <ResumeResultsTable results={results} />
                </div>
            )}
        </div>
    );
}