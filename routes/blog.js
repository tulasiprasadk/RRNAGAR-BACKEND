const express = require("express");
const router = express.Router();
const { Blog } = require("../models");

// Get all blog posts
router.get("/", async (req, res) => {
  try {
    const posts = await Blog.findAll({ order: [["createdAt", "DESC"]] });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: "Failed to load blog posts" });
  }
});

// Create blog post
router.post("/", async (req, res) => {
  try {
    const { title, content, author, published } = req.body;
    const post = await Blog.create({ title, content, author, published });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to create blog post" });
  }
});

// Update blog post
router.put("/:id", async (req, res) => {
  try {
    const post = await Blog.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    const { title, content, author, published } = req.body;
    post.title = title;
    post.content = content;
    post.author = author;
    post.published = published;
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: "Failed to update blog post" });
  }
});

// Delete blog post
router.delete("/:id", async (req, res) => {
  try {
    const post = await Blog.findByPk(req.params.id);
    if (!post) return res.status(404).json({ error: "Not found" });
    await post.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete blog post" });
  }
});

module.exports = router;
// routes/blog.js - Blog API routes
const express = require('express');
const router = express.Router();
const { Blog } = require('../models');

// Get all blog posts
router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.findAll({ order: [['createdAt', 'DESC']] });
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// Get a single blog post
router.get('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

// Create a new blog post
router.post('/', async (req, res) => {
  try {
    const { title, content, author, published } = req.body;
    const blog = await Blog.create({ title, content, author, published });
    res.status(201).json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create blog' });
  }
});

// Update a blog post
router.put('/:id', async (req, res) => {
  try {
    const { title, content, author, published } = req.body;
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    await blog.update({ title, content, author, published });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update blog' });
  }
});

// Delete a blog post
router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByPk(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    await blog.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete blog' });
  }
});

module.exports = router;
