vim.g.mapleader = ' '
--local map = vim.api.nvim_set_keymap
local map = vim.keymap.set
local builtin = require('telescope.builtin')
local opts = { noremap = true, silent = true }
map('n', '<leader>e', ':NvimTreeToggle<CR>', {noremap = true, silent = true})
map('n', '<leader>ff', builtin.find_files, {})
map('n', '<leader>fg', builtin.live_grep, {})
map('n', '<leader>fb', builtin.buffers, {})
map('n', '<leader>fh', builtin.help_tags, {})
map("n", "<leader>th", ":Telescope themes<CR>", {noremap = true, silent = true, desc = "Theme Switcher"})
map("n", "<TAB>", "<cmd>bnext<CR>", opts)
map("n", "<leader>s", "<cmd>wq<CR>", opts)
map("n", "<leader>q", "<cmd>qa<CR>", opts)
map('n', '<leader>t', ':ToggleTerm<CR>', {noremap = true, silent = true})
