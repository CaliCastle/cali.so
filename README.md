## Cali 个人博客网站

Cali 的个人博客网站 [https://cali.so/](https://cali.so/) 的源代码。

需要其他服务商的环境变量才能正常运行，所以如果你想要在本地运行，需要自己配置。

可查看 `.env.example` 文件，里面包含了所有需要的环境变量。

### 技术栈

- [Next.js](https://nextjs.org/)
- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)
- [Radix UI](https://www.radix-ui.com/)
- [Clerk](https://clerk.com/)
- [Neon](https://neon.tech/)
- [Drizzle ORM](https://orm.drizzle.team/)
- [Sanity](https://www.sanity.io/)
- [React Email](https://react.email)
- [Resend](https://resend.com/)

### 教程

想部署成自己的网站？可以查看 Cali 的[官方教程](https://cali.so/blog/guide-for-cloning-my-site)

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建
pnpm build
```

通过 [Vercel](https://vercel.com/) 一键部署。

### 变更日志

- 2024-03-13: **v2.0** 更新了 Sanity 到最新版，Next.js 到 v14.1，提取了首页图片和工作经历到 Sanity 设置里。
- 2024-03-10: **v1.1** 从 PlanetScale 数据库迁移到了 [Neon](https://neon.tech/) 数据库（MySQL -> PostgreSQL），因为 PlanetScale [宣布不再支持免费数据库](https://planetscale.com/blog/planetscale-forever)。
