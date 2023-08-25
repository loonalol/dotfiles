vim.g.mapleader = ' '
local map = vim.api.nvim_set_keymap
local builtin = require('telescope.builtin')
local opts = { noremap = true, silent = true }

map('n', '<leader>e', ':NvimTreeToggle<CR>', {noremap = true, silent = true})
map('n', '<leader>ff', ':Telescope find_files<CR>', {noremap = true, silent = true})
map('n', '<C-[>', ':TroubleToggle<CR>', {noremap = true, silent = true})
map('n', '<C-]>', ':TroubleRefresh<CR>', {noremap = true, silent = true})
