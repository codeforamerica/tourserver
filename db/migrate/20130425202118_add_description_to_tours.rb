class AddDescriptionToTours < ActiveRecord::Migration
  def change
    add_column :tours, :description, :string
  end
end
