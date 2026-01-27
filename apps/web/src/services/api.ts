import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token and tenant ID
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant ID from Zustand persisted auth storage
        const authStorageStr = localStorage.getItem('auth-storage');
        if (authStorageStr) {
            try {
                const authStorage = JSON.parse(authStorageStr);
                const tenantId = authStorage?.state?.tenant?.id;
                if (tenantId) {
                    config.headers['x-tenant-id'] = tenantId;
                }
            } catch (e) {
                // Ignore parse errors
            }
        }

        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken
                });

                localStorage.setItem('accessToken', data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, clear auth and redirect to login
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

// Upload file with presigned URL
export const uploadFile = async (file: File, tenantId: string, projectId: string) => {
    // 1. Get Presigned URL
    const { data: presigned } = await api.post('/uploads/presigned', {
        filename: file.name,
        contentType: file.type,
        tenantId,
        projectId
    });

    // 2. Upload to S3
    await axios.put(presigned.url, file, {
        headers: { 'Content-Type': file.type }
    });

    // 3. Finalize
    const { data: uploadCtx } = await api.post('/uploads/finalize', {
        uploadId: presigned.uploadId
    });

    return uploadCtx;
};

// Dataset APIs
export const getDataset = async (id: string) => {
    const { data } = await api.get(`/datasets/${id}`);
    return data;
};

export const getDatasetPreview = async (id: string) => {
    const { data } = await api.get(`/datasets/${id}/preview`);
    return data;
};

export const getDatasetEDA = async (id: string) => {
    const { data } = await api.get(`/datasets/${id}/eda`);
    return data;
};

// Tenant/User APIs
export const getTenantStats = async () => {
    const { data } = await api.get('/tenants/me/stats');
    return data;
};

// Projects APIs
export const getProjects = async () => {
    const { data } = await api.get('/projects');
    return data;
};

export const createProject = async (name: string, description?: string) => {
    const { data } = await api.post('/projects', { name, description });
    return data;
};

export const deleteProject = async (id: string) => {
    await api.delete(`/projects/${id}`);
};
