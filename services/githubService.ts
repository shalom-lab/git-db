
import { Octokit } from 'octokit';
import { GithubConfig } from '../types';

export interface ValidationResult {
  valid: boolean;
  message: string;
  details?: {
    tokenValid: boolean;
    repoAccessible: boolean;
    hasReadPermission: boolean;
    hasWritePermission: boolean;
  };
}

export class GitHubService {
  private octokit: any;
  private owner: string;
  private repo: string;

  constructor(config: GithubConfig) {
    this.octokit = new Octokit({ auth: config.token });
    const [owner, repo] = config.repo.split('/');
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * 验证 GitHub 配置（token、repo、权限）
   */
  static async validateConfig(config: GithubConfig): Promise<ValidationResult> {
    const { token, repo, path } = config;
    
    if (!token.trim() || !repo.trim()) {
      return {
        valid: false,
        message: 'Token and repository are required',
        details: {
          tokenValid: false,
          repoAccessible: false,
          hasReadPermission: false,
          hasWritePermission: false
        }
      };
    }

    try {
      // 解析 repo 格式：owner/repo
      const repoParts = repo.trim().split('/');
      if (repoParts.length !== 2) {
        return {
          valid: false,
          message: 'Invalid repository format. Expected: owner/repo',
          details: {
            tokenValid: false,
            repoAccessible: false,
            hasReadPermission: false,
            hasWritePermission: false
          }
        };
      }

      const [owner, repoName] = repoParts;
      const octokit = new Octokit({ auth: token.trim() });

      // 1. 验证 token 是否有效
      let tokenValid = false;
      try {
        await octokit.rest.users.getAuthenticated();
        tokenValid = true;
      } catch (error: any) {
        if (error.status === 401) {
          return {
            valid: false,
            message: 'Invalid token. Please check your GitHub token.',
            details: {
              tokenValid: false,
              repoAccessible: false,
              hasReadPermission: false,
              hasWritePermission: false
            }
          };
        }
        throw error;
      }

      // 2. 验证 repo 是否存在且可访问
      let repoAccessible = false;
      try {
        await octokit.rest.repos.get({ owner, repo: repoName });
        repoAccessible = true;
      } catch (error: any) {
        if (error.status === 404) {
          return {
            valid: false,
            message: `Repository "${repo}" not found or you don't have access to it.`,
            details: {
              tokenValid: true,
              repoAccessible: false,
              hasReadPermission: false,
              hasWritePermission: false
            }
          };
        } else if (error.status === 403) {
          return {
            valid: false,
            message: `Access denied to repository "${repo}". Please check your token permissions.`,
            details: {
              tokenValid: true,
              repoAccessible: false,
              hasReadPermission: false,
              hasWritePermission: false
            }
          };
        }
        throw error;
      }

      // 3. 验证 Read 权限（尝试读取仓库根目录）
      let hasReadPermission = false;
      try {
        // 尝试读取根目录来验证 read 权限
        await octokit.rest.repos.getContent({
          owner,
          repo: repoName,
          path: ''
        });
        hasReadPermission = true;
      } catch (error: any) {
        // 403 表示没有权限，404 不应该出现在根目录
        if (error.status === 403) {
          return {
            valid: false,
            message: `Token does not have "Contents: Read" permission for repository "${repo}".`,
            details: {
              tokenValid: true,
              repoAccessible: true,
              hasReadPermission: false,
              hasWritePermission: false
            }
          };
        }
        // 其他错误（如 404）可能是特殊情况，但通常根目录应该存在
        // 为了安全，我们假设没有权限
        return {
          valid: false,
          message: `Token does not have "Contents: Read" permission for repository "${repo}".`,
          details: {
            tokenValid: true,
            repoAccessible: true,
            hasReadPermission: false,
            hasWritePermission: false
          }
        };
      }

      // 4. 验证 Write 权限
      // 通过检查仓库权限或尝试创建一个临时文件来验证
      let hasWritePermission = false;
      
      // 方法1：检查仓库权限（如果 token 有 admin 权限可以看到）
      try {
        const repoInfo = await octokit.rest.repos.get({ owner, repo: repoName });
        // 如果用户是仓库的拥有者或协作者，通常有 write 权限
        // 但这不能完全确定 token 的权限
      } catch (error) {
        // 忽略错误
      }

      // 方法2：尝试创建一个临时测试文件来验证 write 权限
      // 如果成功创建，立即删除
      const testWritePath = `.gitdb-test-${Date.now()}.txt`;
      try {
        // 尝试创建文件
        const createResponse = await octokit.rest.repos.createOrUpdateFileContents({
          owner,
          repo: repoName,
          path: testWritePath,
          message: 'GitDB: Testing write permissions',
          content: btoa('test'),
        });
        hasWritePermission = true;
        
        // 立即删除测试文件
        try {
          const fileInfo = await octokit.rest.repos.getContent({
            owner,
            repo: repoName,
            path: testWritePath
          });
          if (!Array.isArray(fileInfo.data) && (fileInfo.data as any).sha) {
            await octokit.rest.repos.deleteFile({
              owner,
              repo: repoName,
              path: testWritePath,
              message: 'GitDB: Cleanup test file',
              sha: (fileInfo.data as any).sha
            });
          }
        } catch (deleteError) {
          // 删除失败不影响验证结果
          console.warn('Failed to delete test file, but write permission is confirmed');
        }
      } catch (error: any) {
        if (error.status === 403) {
          return {
            valid: false,
            message: `Token does not have "Contents: Write" permission for repository "${repo}". Please grant "Contents: Read and Write" permission.`,
            details: {
              tokenValid: true,
              repoAccessible: true,
              hasReadPermission: true,
              hasWritePermission: false
            }
          };
        }
        // 其他错误（如 422）可能是文件已存在或其他问题，不影响验证
      }

      // 所有验证通过
      return {
        valid: true,
        message: 'Configuration validated successfully!',
        details: {
          tokenValid: true,
          repoAccessible: true,
          hasReadPermission: hasReadPermission,
          hasWritePermission: hasWritePermission
        }
      };

    } catch (error: any) {
      return {
        valid: false,
        message: error.message || 'Validation failed. Please check your configuration.',
        details: {
          tokenValid: false,
          repoAccessible: false,
          hasReadPermission: false,
          hasWritePermission: false
        }
      };
    }
  }

  async getFileMetadata(path: string) {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
      });
      return response.data;
    } catch (error: any) {
      if (error.status === 404) return null;
      throw error;
    }
  }

  async downloadFile(path: string): Promise<Uint8Array> {
    const response = await this.octokit.rest.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
      headers: { accept: 'application/vnd.github.v3.raw' },
    });
    // Response.data is an ArrayBuffer for binary types in Octokit if configured right
    // Otherwise it might be a base64 string
    if (typeof response.data === 'string') {
        const binary = atob(response.data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }
    return new Uint8Array(response.data as any);
  }

  async uploadFile(path: string, content: Uint8Array, sha?: string, message: string = 'Update database') {
    // Convert Uint8Array to base64
    let binary = '';
    const bytes = new Uint8Array(content.buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);

    const response = await this.octokit.rest.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: base64,
      sha,
    });
    return response.data;
  }
}
