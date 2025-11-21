// Service for Release Management operations
class ReleaseService {
  constructor() {
    this.releaseTableName = "rm_release";
    this.releaseFeatureTableName = "x_7767_release_man_release_features";
  }

  // Get all releases
  async getReleases(filters = {}) {
    try {
      const searchParams = new URLSearchParams(filters);
      searchParams.set('sysparm_display_value', 'all');
      searchParams.set('sysparm_order_by', 'work_start');
      
      const response = await fetch(`/api/now/table/${this.releaseTableName}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch releases');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching releases:', error);
      throw error;
    }
  }

  // Get current active release based on current date
  async getCurrentRelease() {
    try {
      const now = new Date();
      const isoDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const filters = {
        'sysparm_query': `work_start<=${isoDate}^work_end>=${isoDate}`,
        'sysparm_limit': '1'
      };
      
      const data = await this.getReleases(filters);
      return data && data.result && data.result.length > 0 ? data.result[0] : null;
    } catch (error) {
      console.error('Error fetching current release:', error);
      throw error;
    }
  }

  // Get release features for a specific release
  async getReleaseFeatures(releaseSysId, filters = {}) {
    try {
      const searchParams = new URLSearchParams(filters);
      searchParams.set('sysparm_display_value', 'all');
      searchParams.set('sysparm_query', `release=${releaseSysId}`);
      searchParams.set('sysparm_order_by', 'deployment_sequence');
      
      const response = await fetch(`/api/now/table/${this.releaseFeatureTableName}?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch release features');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching release features:', error);
      throw error;
    }
  }

  // Create new release feature
  async createReleaseFeature(data) {
    try {
      const response = await fetch(`/api/now/table/${this.releaseFeatureTableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create release feature');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating release feature:', error);
      throw error;
    }
  }

  // Update release feature
  async updateReleaseFeature(sysId, data) {
    try {
      const response = await fetch(`/api/now/table/${this.releaseFeatureTableName}/${sysId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update release feature');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating release feature:', error);
      throw error;
    }
  }

  // Delete release feature
  async deleteReleaseFeature(sysId) {
    try {
      const response = await fetch(`/api/now/table/${this.releaseFeatureTableName}/${sysId}`, {
        method: "DELETE",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete release feature');
      }

      return response.ok;
    } catch (error) {
      console.error('Error deleting release feature:', error);
      throw error;
    }
  }

  // Get users for developer assignment
  async getUsers(filters = {}) {
    try {
      const searchParams = new URLSearchParams(filters);
      searchParams.set('sysparm_display_value', 'all');
      searchParams.set('sysparm_fields', 'sys_id,name,email,first_name,last_name');
      searchParams.set('sysparm_query', 'active=true^user_name!=admin^user_name!=system');
      
      const response = await fetch(`/api/now/table/sys_user?${searchParams.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "X-UserToken": window.g_ck
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch users');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }
}

export default new ReleaseService();