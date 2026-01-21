
import { Octokit } from 'octokit';
import { GithubConfig } from '../types';

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
