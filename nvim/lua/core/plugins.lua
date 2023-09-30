local lazypath = vim.fn.stdpath("data") .. "/lazy/lazy.nvim"
if not vim.loop.fs_stat(lazypath) then
  vim.fn.system({
    "git",
    "clone",
    "--filter=blob:none",
    "https://github.com/folke/lazy.nvim.git",
    "--branch=stable", -- latest stable release
    lazypath,
  })
end
vim.opt.rtp:prepend(lazypath)

local plugins = {
'hrsh7th/nvim-cmp',
'andweeb/presence.nvim',
'hrsh7th/cmp-nvim-lsp',
'nvim-treesitter/nvim-treesitter',
'nvim-lualine/lualine.nvim',
'L3MON4D3/LuaSnip',
'saadparwaiz1/cmp_luasnip',
{'akinsho/toggleterm.nvim', version = "*", config = true},
"rafamadriz/friendly-snippets",
"williamboman/mason.nvim",
"neovim/nvim-lspconfig",
"williamboman/mason-lspconfig.nvim",
'nvim-telescope/telescope.nvim',
'nvim-lua/plenary.nvim',
'nvim-tree/nvim-tree.lua',
{
    'goolord/alpha-nvim',
    config = function ()
        require'alpha'.setup(require'alpha.themes.dashboard'.config)
    end
};
{ 'rose-pine/neovim', name = 'rose-pine' },
{'akinsho/bufferline.nvim', version = "*", dependencies = 'nvim-tree/nvim-web-devicons'},
{
    'nvim-telescope/telescope.nvim',
    cmd = 'Telescope',
    lazy = true,
    dependencies = {
		'andrew-george/telescope-themes',
		-- your other dependencies
    },
    config = function()
	    -- load extension
	    local telescope = require('telescope')
	    telescope.load_extension('themes')
    end
},

}

require("lazy").setup(plugins, opts)
