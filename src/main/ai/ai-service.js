// ai-service.js
// 直接在主进程中调用AI功能，避免子进程通信开销

import { imageToImage } from './image-gen.js';
import { generateVideo } from './video-gen.js';

/**
 * AI服务类，封装所有AI功能调用
 */
class AIService {
  /**
   * 生成图片
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 结果对象
   */
  static async generateImage(options) {
    try {
      const imageUrl = await textToImage(options);
      
      return {
        status: 'success',
        image_url: imageUrl
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
  
  /**
   * 编辑图片
   * @param {Object} options - 编辑选项
   * @returns {Promise<Object>} 结果对象
   */
  static async editImage(options) {
    const imageUrl = await imageToImage(options);
    
    return {
      status: 'success',
      image_url: imageUrl
    };
  }
  
  /**
   * 生成视频
   * @param {Object} options - 视频生成选项
   * @returns {Promise<Object>} 结果对象
   */
  static async generateVideo(options) {
    try {
      const videoUrl = await generateVideo(options);
      
      return {
        status: 'success',
        video_url: videoUrl
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
}

export default AIService;