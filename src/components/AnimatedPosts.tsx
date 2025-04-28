"use client";

import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";

interface AnimatedPostsProps {
  posts: any[]; // adjust `any` to your actual Post type if available
  dbUserId: string | null; // accept string or null
}

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.15, // delay between posts
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 30,
    },
  },
};

export default function AnimatedPosts({ posts, dbUserId }: AnimatedPostsProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {posts.map((post) => (
        <motion.div key={post.id} variants={itemVariants}>
          <PostCard post={post} dbUserId={dbUserId} />
        </motion.div>
      ))}
    </motion.div>
  );
}
